#!/usr/bin/env node
// node scripts/stats-fetch-backup.mjs <folder>
//
// Used by the weekly "Stats backup" workflow (.github/workflows/stats-backup.yml).
// Downloads the complete statistics from the site's own public export route
// (the "Download data (JSON)" button on /stats), checks them, and saves
//   <folder>/<YYYY-MM-DD>.json   one file per run (all kept)
//   <folder>/latest.json         always the newest good backup
//
// No database credentials: it only reads the public route. If the route
// cannot be reached, or returns anything that is not a complete, non-empty
// backup, or a backup with fewer days or visits than the last one, it exits
// with an error and writes NOTHING, so a bad backup never replaces a good one.
// No dependencies, so the workflow does not need `npm install`.

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { backupProblems } from "./lib/stats-backup-check.mjs";

const folder = resolve(process.argv[2] ?? "data/stats-backup");
const site = (process.env.STATS_SITE_URL || "https://my-resume-pied-tau.vercel.app").replace(/\/$/, "");
const url = `${site}/api/stats/export?format=json`;

function fail(message) {
  console.error(`stats backup: ${message} Nothing was saved.`);
  process.exit(1);
}

let text;
try {
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) fail(`${url} answered ${response.status} ${response.statusText}.`);
  text = await response.text();
} catch (error) {
  fail(`could not reach ${url} (${error.message}).`);
}

let data;
try {
  data = JSON.parse(text);
} catch {
  fail(`${url} did not return valid JSON.`);
}

const latestFile = join(folder, "latest.json");
let previous = null;
if (existsSync(latestFile)) {
  try {
    previous = JSON.parse(readFileSync(latestFile, "utf8"));
  } catch {
    previous = null; // an unreadable latest.json is replaced by this good backup
  }
}

const problems = backupProblems(data, previous);
if (problems.length) fail(`the export is not a usable backup:\n  - ${problems.join("\n  - ")}\n`);

// Write to temporary files first, then rename: a crash can never leave a
// half-written backup behind.
mkdirSync(folder, { recursive: true });
const date = data.exportedAt.slice(0, 10);
const body = JSON.stringify(data, null, 2) + "\n";
for (const name of [`${date}.json`, "latest.json"]) {
  writeFileSync(join(folder, `${name}.tmp`), body);
  renameSync(join(folder, `${name}.tmp`), join(folder, name));
}
const days = Object.keys(data.days).length;
console.log(`stats backup: saved ${date}.json and latest.json (${days} day${days === 1 ? "" : "s"}, ${Number(data.total.v ?? 0)} all-time visits).`);
