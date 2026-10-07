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
//   3. A fork is shown only if my copy has commits of my own that the
//      original does not have (my default branch compared with the parent's).
//      overrides.json can force it either way: "include": true or "hide": true.
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
//
// It also runs once a day on GitHub Actions (.github/workflows/sync-projects.yml)
// with the workflow's own token. Two things keep those runs quiet when nothing
// changed: the report only gets a new date when its content changes, and the
// "last updated" date of a repo ignores the commits this workflow makes.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createGrouping, formatShare, languageBreakdown } from "./lib/grouping.mjs";
import { knownCodes, translationGaps } from "./lib/i18n.mjs";
import { readmeContent, readmeImage } from "./lib/readme.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const projectsFile = join(root, "src", "data", "projects.json");
const reportFile = join(root, "SYNC-REPORT.md");
// Preview images found in READMEs are downloaded here, so the site never
// depends on GitHub being reachable. Manual screenshots in public/projects/
// always win over these.
const readmeImageDir = join(root, "public", "projects", "readme");
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// Whose repositories to list. Locally gh lists the logged-in user's own; the
// GitHub Actions token is not a user, so the workflow sets SYNC_OWNER.
const OWNER = process.env.SYNC_OWNER?.trim() || "";
// The account the daily workflow commits as. Its commits are not my work, so
// they never count as a repo's "last updated" date.
const SYNC_BOT = "github-actions[bot]";
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
  "nameWithOwner",
  "parent",
  "defaultBranchRef",
].join(",");

const { compareGroups, autoGroup, decideGroup, applyTabRule } = createGrouping(rules);

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

/** Runs `gh api <path>` and returns the parsed JSON. Arguments are never passed through a shell. */
function ghApi(path) {
  const stdout = execFileSync("gh", ["api", path], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return JSON.parse(stdout);
}

/**
 * For a fork: how many commits my default branch has that the original's
 * default branch does not (GitHub's "ahead by"), and how far it is behind.
 */
function compareWithParent(repo) {
  const parent = repo.parent;
  if (!parent?.owner?.login || !parent?.name) throw new Error("the original repository is not available");
  const parentName = `${parent.owner.login}/${parent.name}`;
  const myOwner = repo.nameWithOwner.split("/")[0];
  const myBranch = repo.defaultBranchRef?.name;
  if (!myBranch) throw new Error("my copy has no default branch");
  const parentRepo = ghApi(`repos/${parentName}`);
  const parentBranch = parentRepo.default_branch;
  // Cross-repository compare: <parent branch>...<my owner>:<my branch>
  const basehead = `${encodeURIComponent(parentBranch)}...${encodeURIComponent(myOwner)}:${encodeURIComponent(myBranch)}`;
  const result = ghApi(`repos/${parentName}/compare/${basehead}`);
  return {
    parentName,
    ahead: result.ahead_by,
    behind: result.behind_by,
    parentDescription: parentRepo.description?.trim() || "",
    parentHomepage: parentRepo.homepage?.trim() || "",
  };
}

/** Whether a fork is shown, and why. Overrides win; otherwise it needs commits of my own. */
function decideFork(repo) {
  const o = overrideFor(repo.name);
  if (o.hide === true) {
    return { show: false, forkOf: null, inherited: { description: false, homepage: false }, reason: '"hide": true in overrides.json' };
  }
  let comparison = null;
  let error = null;
  try {
    comparison = compareWithParent(repo);
  } catch (e) {
    error = (e.stderr?.toString().trim() || e.message).split("\n")[0];
  }
  const forkOf = comparison?.parentName ?? (repo.parent ? `${repo.parent.owner?.login}/${repo.parent.name}` : null);
  // A fork starts with the original's description and website. When they are
  // still identical they describe the original, not my work, so they are not used.
  const inherited = {
    description: Boolean(comparison?.parentDescription) && repo.description?.trim() === comparison.parentDescription,
    homepage: Boolean(comparison?.parentHomepage) && repo.homepageUrl?.trim() === comparison.parentHomepage,
  };
  const base = { forkOf, inherited };
  if (o.include === true) return { ...base, show: true, reason: '"include": true in overrides.json' };
  if (error) return { ...base, show: false, reason: `could not compare with the original (${error})` };
  if (comparison.ahead > 0) {
    return { ...base, show: true, reason: `${plural(comparison.ahead, "commit")} of my own that ${forkOf} does not have` };
  }
  return { ...base, show: false, reason: `no commits of my own beyond ${forkOf}` };
}

/**
 * When a repo last changed: the date of the newest commit on its default
 * branch that was not made by the sync workflow. GitHub's pushedAt would also
 * move with the workflow's own commits to this site's repo, and then every
 * daily run would find a "change" and commit again. Falls back to pushedAt.
 */
function lastChangedAt(repo) {
  const branch = repo.defaultBranchRef?.name;
  if (!branch) return repo.pushedAt;
  try {
    const commits = ghApi(`repos/${repo.nameWithOwner}/commits?sha=${encodeURIComponent(branch)}&per_page=30`);
    const own = commits.find((c) => c.author?.login !== SYNC_BOT && c.commit?.author?.name !== SYNC_BOT);
    return own?.commit?.committer?.date ?? repo.pushedAt;
  } catch {
    return repo.pushedAt;
  }
}

/** The README of a repo as text, or "" when there is none. */
function fetchReadme(fullName) {
  try {
    const data = ghApi(`repos/${fullName}/readme`);
    return Buffer.from(data.content ?? "", data.encoding === "base64" ? "base64" : "utf8").toString("utf8");
  } catch {
    return "";
  }
}

/** Downloads a README image into public/projects/readme/. Returns the site path or null. */
async function downloadImage(url, name) {
  try {
    const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20_000) });
    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !type.startsWith("image/") || type.includes("svg")) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 2_000 || bytes.length > MAX_IMAGE_BYTES) return null; // tiny icons or huge files
    const ext = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" }[type.split(";")[0]];
    if (!ext) return null;
    mkdirSync(readmeImageDir, { recursive: true });
    writeFileSync(join(readmeImageDir, `${name}.${ext}`), bytes);
    return `/projects/readme/${name}.${ext}`;
  } catch {
    return null;
  }
}

function fetchRepos() {
  const stdout = execFileSync("gh", ["repo", "list", ...(OWNER ? [OWNER] : []), "--limit", "200", "--json", FIELDS], {
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

// Decide every fork once (this asks GitHub to compare it with its original).
const forkDecisions = new Map(nonEmpty.filter((repo) => repo.isFork).map((repo) => [repo.name, decideFork(repo)]));
const skippedForks = nonEmpty.filter((repo) => repo.isFork && !forkDecisions.get(repo.name).show);
const selected = nonEmpty.filter((repo) => !repo.isFork || forkDecisions.get(repo.name).show);

const firstPass = selected.map((repo) => {
  const languages = languageBreakdown(repo.languages);
  const decision = decideGroup(languages, overrideFor(repo.name));
  return { repo, languages, ...decision };
});

// A language gets its own tab only if it is mainstream or has at least two
// projects; otherwise it moves to "Other". Groups forced in overrides.json stay.
const tabbed = applyTabRule(
  firstPass.map((row) => ({
    name: row.repo.name,
    group: row.group,
    reason: row.reason,
    forced: Boolean(overrideFor(row.repo.name).group),
    hidden: overrideFor(row.repo.name).hide === true,
  })),
);
const rows = firstPass.map((row, i) => ({
  ...row,
  group: tabbed[i].group,
  reason: tabbed[i].reason,
  auto: tabbed[i].forced ? row.auto : tabbed[i].group,
}));

// READMEs: summary, overview and preview image. A fork's README is only used
// if it differs from its original's (an unchanged one describes the original).
const readmes = new Map();
for (const { repo } of rows) {
  const markdown = fetchReadme(repo.nameWithOwner);
  const parentName = repo.isFork ? forkDecisions.get(repo.name).forkOf : null;
  const inheritedReadme = Boolean(parentName && markdown && markdown === fetchReadme(parentName));
  const content = inheritedReadme ? { summary: "", overview: "" } : readmeContent(markdown);
  const imageUrl = inheritedReadme
    ? null
    : readmeImage(markdown, { owner: repo.nameWithOwner.split("/")[0], repo: repo.name, branch: repo.defaultBranchRef?.name ?? "main" });
  readmes.set(repo.name, { ...content, imageUrl, inheritedReadme });
}
const readmeImages = new Map();
for (const [name, info] of readmes) {
  if (info.imageUrl) readmeImages.set(name, await downloadImage(info.imageUrl, name));
}
// Remove downloaded images that are no longer used.
if (existsSync(readmeImageDir)) {
  const keep = new Set([...readmeImages.values()].filter(Boolean).map((p) => p.split("/").pop()));
  for (const file of readdirSync(readmeImageDir)) if (!keep.has(file)) rmSync(join(readmeImageDir, file));
}

const inheritedFrom = (repo) => (repo.isFork ? forkDecisions.get(repo.name).inherited : { description: false, homepage: false });

const projects = rows
  .map(({ repo, languages, auto }) => ({
    name: repo.name,
    description: inheritedFrom(repo).description ? "" : repo.description?.trim() || "",
    // The automatic group. A "group" in overrides.json is applied on top by the site.
    group: auto,
    languages: languages.map((l) => ({ name: l.name, share: Math.round(l.share * 10) / 10 })),
    readmeSummary: readmes.get(repo.name)?.summary ?? "",
    readmeOverview: readmes.get(repo.name)?.overview ?? "",
    readmeImage: readmeImages.get(repo.name) ?? null,
    isFork: repo.isFork,
    forkOf: repo.isFork ? forkDecisions.get(repo.name).forkOf : null,
    url: repo.url,
    homepageUrl: inheritedFrom(repo).homepage ? null : repo.homepageUrl?.trim() || null,
    topics: (repo.repositoryTopics ?? []).map((t) => t.name ?? t.topic?.name).filter(Boolean),
    pushedAt: lastChangedAt(repo),
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
function forkNote(repo) {
  if (!repo.isFork) return "";
  const { reason, inherited } = forkDecisions.get(repo.name);
  const dropped = [inherited.description && "description", inherited.homepage && "website"].filter(Boolean);
  const droppedNote = dropped.length ? `; ${dropped.join(" and ")} inherited from the original, not shown` : "";
  return ` (fork shown: ${reason}${droppedNote})`;
}

const groupCounts = new Map();
for (const row of rows) {
  if (overrideFor(row.repo.name).hide === true) continue;
  groupCounts.set(row.group, (groupCounts.get(row.group) ?? 0) + 1);
}
const summary = [...groupCounts.entries()].sort((a, b) => compareGroups(a[0], b[0]));

const forkRows = skippedForks
  .map((repo) => ({ repo, languages: languageBreakdown(repo.languages) }))
  .map((f) => ({ ...f, wouldBe: autoGroup(f.languages).group, why: forkDecisions.get(f.repo.name).reason }))
  .sort((a, b) => a.repo.name.localeCompare(b.repo.name));

/** What the site uses from a repo's README, in words. */
function readmeNote(name) {
  const info = readmes.get(name);
  if (!info) return "";
  if (info.inheritedReadme) return "README unchanged from the original, not used";
  const used = [info.summary && "summary", info.overview && "overview", readmeImages.get(name) && "image"].filter(Boolean);
  return used.length ? used.join(", ") : "nothing usable (generated tile instead)";
}

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
console.log("\nForks skipped (shown only with commits of my own, or \"include\": true in overrides.json)\n");
if (forkRows.length) {
  printTable(
    ["Fork", "Top languages", "Would be in", "Why skipped"],
    forkRows.map((f) => [f.repo.name, topLanguages(f.languages), f.wouldBe, f.why]),
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

/**
 * Projects on the site whose summary is missing in some configured language
 * (they show the English text there). Same rules as `npm run i18n:check`.
 */
function translationGapRows() {
  const config = readJson(join(root, "src", "i18n", "languages.json"));
  const codes = knownCodes(config);
  const others = config.languages.filter((code) => code !== "en");
  return projects
    .filter((repo) => overrideFor(repo.name).hide !== true)
    .map((repo) => {
      const summary = overrideFor(repo.name).summary;
      if (summary === undefined || typeof summary === "string") {
        return { name: repo.name, missing: summary || repo.description || repo.readmeSummary ? others : [] };
      }
      const missing = translationGaps(summary, others, codes).filter((g) => g.problem === "missing").map((g) => g.locale);
      return { name: repo.name, missing };
    })
    .filter((row) => row.missing.length > 0);
}

// Markdown version, saved to SYNC-REPORT.md. Pipes in text would break a
// Markdown table, so they are escaped.
const md = (text) => String(text).replaceAll("|", "\\|");
// The date line is filled in below, so it can stay the same when nothing else changed.
const DATE_LINE = /^Last changed: .*$/m;
const report = [
  "# Sync report",
  "",
  "Generated by `npm run sync` (scripts/sync-projects.mjs). Do not edit by hand.",
  "Last changed: DATE.",
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
  "| Repo | Top languages | Group | Reason | From README |",
  "| --- | --- | --- | --- | --- |",
  ...sortedRows.map(
    (r) =>
      `| [${md(r.repo.name)}](${r.repo.url}) | ${md(topLanguages(r.languages))} | ${md(r.group)} | ${md(
        r.reason + hiddenNote(r.repo.name) + forkNote(r.repo),
      )} | ${md(readmeNote(r.repo.name))} |`,
  ),
  "",
  "## Forks skipped",
  "",
  "A fork is shown when my copy has commits of my own that the original does not have. To force one",
  'either way, set `"include": true` or `"hide": true` for it in `src/data/overrides.json` and run `npm run sync` again.',
  "",
  ...(forkRows.length
    ? [
        "| Fork | Top languages | Would be in | Why skipped |",
        "| --- | --- | --- | --- |",
        ...forkRows.map(
          (f) => `| [${md(f.repo.name)}](${f.repo.url}) | ${md(topLanguages(f.languages))} | ${md(f.wouldBe)} | ${md(f.why)} |`,
        ),
      ]
    : ["None."]),
  "",
  "## Project texts per language",
  "",
  "The site shows each project's summary in the page's language when `src/data/overrides.json` has one",
  '(`"summary": { "en": "...", "de": "..." }`); otherwise it shows the English text with an "In English" label.',
  "",
  ...(() => {
    const gaps = translationGapRows();
    return gaps.length
      ? ["| Repo | Summary missing in |", "| --- | --- |", ...gaps.map((g) => `| ${md(g.name)} | ${md(g.missing.join(", "))} |`)]
      : ["Every project shown has a summary in every language."];
  })(),
  "",
  "## Other skipped repositories",
  "",
  `- Empty: ${emptyRepos.length ? emptyRepos.map((r) => r.name).join(", ") : "none"}`,
  // No count: the workflow's token cannot see private repos at all, and the
  // report must read the same whichever token ran the sync.
  "- Private: never listed (dropped before any other step)",
  "",
].join("\n");

// Keep the old file (and its date) when only the date would change, so the
// daily workflow finds nothing to commit.
const previous = existsSync(reportFile) ? readFileSync(reportFile, "utf8") : "";
const today = new Date().toISOString().slice(0, 10);
if (previous.replace(DATE_LINE, "") === report.replace(DATE_LINE, "")) {
  console.log("sync: SYNC-REPORT.md unchanged.");
} else {
  writeFileSync(reportFile, report.replace("Last changed: DATE.", `Last changed: ${today}.`));
  console.log("sync: wrote SYNC-REPORT.md.");
}
