#!/usr/bin/env node
// Pulls my GitHub repositories with the GitHub CLI (gh), decides which tab
// (language group) each one belongs to, and writes:
//   - src/data/projects.json   the data the site reads (never edit by hand)
//   - SYNC-REPORT.md           a readable report of every decision
// Run it with `npm run sync`, then commit both files.
//
// Rules (the lists themselves live in src/data/language-groups.json):
//   1. Private repositories never appear, not even in the report.
//   2. Empty repositories are skipped.
//   3. Forks are skipped unless overrides.json sets "include": true for them.
//   4. Each repo's group comes from its full language breakdown, not from
//      GitHub's single "primary language" label:
//        - languages that are not project code (HTML, CSS, Shell, TeX, ...)
//          are ignored,
//        - related languages are merged (Jupyter Notebook -> Python,
//          C + C++ -> "C / C++", JavaScript + TypeScript -> one group),
//        - the group with the largest share of the remaining code wins,
//        - if nothing is left, the repo goes to "Other".
//   5. A "group" set in overrides.json always wins.
//
// Only this script needs gh. The website just reads the JSON files, so
// Vercel (or any host) never needs gh installed.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createGrouping, formatShare, languageBreakdown } from "./lib/grouping.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const projectsFile = join(root, "src", "data", "projects.json");
const reportFile = join(root, "SYNC-REPORT.md");
const rules = readJson(join(root, "src", "data", "language-groups.json"));
const overrides = readJson(join(root, "src", "data", "overrides.json"));

const FIELDS = [
  "name",
  "description",
  "primaryLanguage",
  "languages",
  "url",
  "homepageUrl",
  "repositoryTopics",
  "pushedAt",
  "isFork",
  "isPrivate",
  "isEmpty",
].join(",");

const { compareGroups, autoGroup, decideGroup } = createGrouping(rules);

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

/** Overrides for one repo. Keys starting with "_" in overrides.json are notes. */
function overrideFor(name) {
  return name.startsWith("_") ? {} : (overrides[name] ?? {});
}

/** 1 -> "1 fork", 2 -> "2 forks". */
function plural(count, word) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

function fetchRepos() {
  const stdout = execFileSync("gh", ["repo", "list", "--limit", "200", "--json", FIELDS], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 32 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

let repos;
try {
  repos = fetchRepos();
} catch (error) {
  const reason = error.stderr?.toString().trim() || error.message;
  console.error(`sync: could not read repositories with gh (${reason}).`);
  if (!existsSync(projectsFile)) {
    // Leave an empty list so the site still builds.
    writeFileSync(projectsFile, "[]\n");
    console.error("sync: wrote an empty src/data/projects.json.");
  } else {
    console.error("sync: kept the existing src/data/projects.json unchanged.");
  }
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Selecting and grouping
// ---------------------------------------------------------------------------

// Strict check on purpose: anything not explicitly public is dropped here,
// before any other step, so private repos never reach the site or the report.
const publicRepos = repos.filter((repo) => repo.isPrivate === false);
const privateCount = repos.length - publicRepos.length;

const emptyRepos = publicRepos.filter((repo) => repo.isEmpty === true);
const nonEmpty = publicRepos.filter((repo) => repo.isEmpty !== true);

const isIncludedFork = (repo) => overrideFor(repo.name).include === true;
const skippedForks = nonEmpty.filter((repo) => repo.isFork && !isIncludedFork(repo));
const selected = nonEmpty.filter((repo) => !repo.isFork || isIncludedFork(repo));

const rows = selected.map((repo) => {
  const languages = languageBreakdown(repo.languages);
  const decision = decideGroup(languages, overrideFor(repo.name));
  return { repo, languages, ...decision };
});

const projects = rows
  .map(({ repo, languages, auto }) => ({
    name: repo.name,
    description: repo.description?.trim() || "",
    // The automatic group. A "group" in overrides.json is applied on top by the site.
    group: auto,
    languages: languages.map((l) => ({ name: l.name, share: Math.round(l.share * 10) / 10 })),
    isFork: repo.isFork,
    url: repo.url,
    homepageUrl: repo.homepageUrl?.trim() || null,
    topics: (repo.repositoryTopics ?? []).map((t) => t.name ?? t.topic?.name).filter(Boolean),
    pushedAt: repo.pushedAt,
  }))
  .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));

writeFileSync(projectsFile, JSON.stringify(projects, null, 2) + "\n");

// ---------------------------------------------------------------------------
// Report (console + SYNC-REPORT.md)
// ---------------------------------------------------------------------------

const topLanguages = (languages) =>
  languages.length ? languages.slice(0, 3).map((l) => `${l.name} ${formatShare(l.share)}`).join(", ") : "none";

const sortedRows = [...rows].sort((a, b) => compareGroups(a.group, b.group) || a.repo.name.localeCompare(b.repo.name));
const hiddenNote = (name) => (overrideFor(name).hide === true ? " (hidden on the site via overrides.json)" : "");
const forkNote = (repo) => (repo.isFork ? " (fork, included via overrides.json)" : "");

const groupCounts = new Map();
for (const row of rows) {
  if (overrideFor(row.repo.name).hide === true) continue;
  groupCounts.set(row.group, (groupCounts.get(row.group) ?? 0) + 1);
}
const summary = [...groupCounts.entries()].sort((a, b) => compareGroups(a[0], b[0]));

const forkRows = skippedForks
  .map((repo) => ({ repo, languages: languageBreakdown(repo.languages) }))
  .map((f) => ({ ...f, wouldBe: autoGroup(f.languages).group }))
  .sort((a, b) => a.repo.name.localeCompare(b.repo.name));

// Console version: aligned plain-text columns.
function printTable(headers, data) {
  const widths = headers.map((h, i) => Math.max(h.length, ...data.map((row) => row[i].length)));
  const line = (cells) => cells.map((c, i) => c.padEnd(widths[i])).join("  ").trimEnd();
  console.log(line(headers));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  for (const row of data) console.log(line(row));
}

console.log("\nProjects and their groups\n");
printTable(
  ["Repo", "Top languages", "Group", "Reason"],
  sortedRows.map((r) => [r.repo.name, topLanguages(r.languages), r.group, r.reason + hiddenNote(r.repo.name) + forkNote(r.repo)]),
);
console.log("\nForks skipped (add \"include\": true in overrides.json to show one)\n");
if (forkRows.length) {
  printTable(
    ["Fork", "Top languages", "Would be in"],
    forkRows.map((f) => [f.repo.name, topLanguages(f.languages), f.wouldBe]),
  );
} else {
  console.log("none");
}
console.log(
  `\nsync: wrote ${projects.length} projects to src/data/projects.json` +
    ` (skipped: ${plural(skippedForks.length, "fork")}, ${plural(emptyRepos.length, "empty repo")},` +
    ` ${plural(privateCount, "private repo")}).`,
);
console.log(`sync: on the site: ${summary.map(([g, n]) => `${g} ${n}`).join(", ")}.`);

// Markdown version, saved to SYNC-REPORT.md. Pipes in text would break a
// Markdown table, so they are escaped.
const md = (text) => String(text).replaceAll("|", "\\|");
const report = [
  "# Sync report",
  "",
  "Generated by `npm run sync` (scripts/sync-projects.mjs). Do not edit by hand.",
  `Last run: ${new Date().toISOString().slice(0, 10)}.`,
  "",
  "## Groups on the site",
  "",
  "| Group | Projects |",
  "| --- | --- |",
  ...summary.map(([group, count]) => `| ${md(group)} | ${count} |`),
  "",
  "## Projects",
  "",
  "Percentages are shares of all code in the repo, as measured by GitHub.",
  "",
  "| Repo | Top languages | Group | Reason |",
  "| --- | --- | --- | --- |",
  ...sortedRows.map(
    (r) =>
      `| [${md(r.repo.name)}](${r.repo.url}) | ${md(topLanguages(r.languages))} | ${md(r.group)} | ${md(
        r.reason + hiddenNote(r.repo.name) + forkNote(r.repo),
      )} |`,
  ),
  "",
  "## Forks skipped",
  "",
  'To show a fork on the site, add `"include": true` for it in `src/data/overrides.json` and run `npm run sync` again.',
  "",
  ...(forkRows.length
    ? [
        "| Fork | Top languages | Would be in |",
        "| --- | --- | --- |",
        ...forkRows.map((f) => `| [${md(f.repo.name)}](${f.repo.url}) | ${md(topLanguages(f.languages))} | ${md(f.wouldBe)} |`),
      ]
    : ["None."]),
  "",
  "## Other skipped repositories",
  "",
  `- Empty: ${emptyRepos.length ? emptyRepos.map((r) => r.name).join(", ") : "none"}`,
  `- Private: ${privateCount} (never listed by name)`,
  "",
];
writeFileSync(reportFile, report.join("\n"));
console.log("sync: wrote SYNC-REPORT.md.");
