// npm run i18n:check
//
// Lists, per language, every text that is missing or still identical to the
// English one:
//   - interface texts in messages/<code>.json (compared with messages/en.json),
//   - translated fields in src/data/profile.json,
//   - project summaries in src/data/overrides.json, for every project the
//     site shows (repos without a summary in a language show English there).
//
// "Same as English" is not always wrong (a name, "Docker", "Backend"); read
// the list and decide. Exits with code 1 only when something is missing, so
// it can be used in a check before pushing.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { knownCodes, messageGaps, translationGaps } from "./lib/i18n.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => JSON.parse(readFileSync(join(ROOT, path), "utf8"));

const config = read("src/i18n/languages.json");
const codes = knownCodes(config);
const others = config.languages.filter((code) => code !== "en");
const english = read("messages/en.json");
const profile = read("src/data/profile.json");
const overrides = read("src/data/overrides.json");
const projects = read("src/data/projects.json");

// gaps[locale] = [{ where, problem }]
const gaps = Object.fromEntries(others.map((code) => [code, []]));

// 1. Interface texts
for (const code of others) {
  const file = `messages/${code}.json`;
  if (!existsSync(join(ROOT, file))) {
    gaps[code].push({ where: file, problem: "file missing (the whole interface shows English)" });
    continue;
  }
  for (const gap of messageGaps(english, read(file))) gaps[code].push({ where: `${file} → ${gap.path}`, problem: gap.problem });
}

// 2. profile.json
for (const gap of translationGaps(profile, others, codes)) {
  gaps[gap.locale].push({ where: `profile.json → ${gap.path}`, problem: gap.problem });
}

// 3. Project summaries of the projects on the site
for (const repo of projects) {
  const override = overrides[repo.name] ?? {};
  if (override.hide === true) continue;
  const summary = override.summary;
  const where = `overrides.json → ${repo.name}.summary`;
  if (summary === undefined || typeof summary === "string") {
    if (!summary && !repo.description && !repo.readmeSummary) continue; // no text in any language
    for (const code of others) gaps[code].push({ where, problem: "missing (English is shown)" });
    continue;
  }
  for (const gap of translationGaps(summary, others, codes)) gaps[gap.locale].push({ where, problem: gap.problem });
}

// Scripts without a website font fall back to the visitor's system fonts.
for (const code of others) {
  const script = config.catalog[code]?.script;
  if (script && script !== "latin" && !config.scripts[script]?.site) {
    gaps[code].push({ where: `src/i18n/fonts.ts (script "${script}")`, problem: "no website font" });
  }
}

let missing = 0;
for (const code of others) {
  const list = gaps[code];
  const name = config.catalog[code]?.name ?? code;
  console.log(`\n${code} (${name}): ${list.length === 0 ? "complete" : `${list.length} to check`}`);
  for (const gap of list) {
    console.log(`  ${gap.problem.padEnd(18)} ${gap.where}`);
    if (gap.problem.startsWith("missing") || gap.problem.startsWith("file missing")) missing += 1;
  }
}
console.log(missing === 0 ? "\nNothing missing." : `\n${missing} missing in total.`);
process.exitCode = missing === 0 ? 0 : 1;
