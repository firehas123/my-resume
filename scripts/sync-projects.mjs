#!/usr/bin/env node
// Pulls my public GitHub repositories with the GitHub CLI (gh) and writes
// src/data/projects.json. Run it with `npm run sync`, then commit the result.
//
// - Private repositories and forks are skipped.
// - primaryLanguage is mapped to one of the three tabs: C++, Python, Other.
// - homepageUrl becomes the "Live demo" link.
// - The output is generated: never edit projects.json by hand. Put manual
//   changes in src/data/overrides.json instead (overrides always win).
//
// Only this script needs gh. The website itself just reads the JSON file,
// so Vercel (or any host) never needs gh installed.

import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outFile = join(root, "src", "data", "projects.json");

const FIELDS =
  "name,description,primaryLanguage,url,homepageUrl,repositoryTopics,pushedAt,isFork,isPrivate";

// Which tab a GitHub language belongs to. Anything not listed goes to "Other".
const LANGUAGE_GROUPS = {
  "C++": "C++",
  C: "C++",
  Python: "Python",
  "Jupyter Notebook": "Python",
};

function writeProjects(projects) {
  writeFileSync(outFile, JSON.stringify(projects, null, 2) + "\n");
}

function fetchRepos() {
  const stdout = execFileSync(
    "gh",
    ["repo", "list", "--limit", "200", "--json", FIELDS],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  return JSON.parse(stdout);
}

function toProject(repo) {
  const language = repo.primaryLanguage?.name ?? null;
  return {
    name: repo.name,
    description: repo.description?.trim() || "",
    language,
    group: LANGUAGE_GROUPS[language] ?? "Other",
    url: repo.url,
    homepageUrl: repo.homepageUrl?.trim() || null,
    topics: (repo.repositoryTopics ?? []).map((t) => t.name ?? t.topic?.name).filter(Boolean),
    pushedAt: repo.pushedAt,
  };
}

let repos;
try {
  repos = fetchRepos();
} catch (error) {
  const reason = error.stderr?.toString().trim() || error.message;
  console.error(`sync: could not read repositories with gh (${reason}).`);
  if (!existsSync(outFile)) {
    // Leave an empty list so the site still builds.
    writeProjects([]);
    console.error("sync: wrote an empty src/data/projects.json.");
  } else {
    console.error("sync: kept the existing src/data/projects.json unchanged.");
  }
  process.exit(1);
}

const projects = repos
  // Strict checks on purpose: a private repo must never reach the site.
  .filter((repo) => repo.isPrivate === false && repo.isFork === false)
  .map(toProject)
  .sort((a, b) => b.pushedAt.localeCompare(a.pushedAt));

writeProjects(projects);
const skipped = repos.length - projects.length;
console.log(`sync: wrote ${projects.length} projects (${skipped} private or forked skipped).`);
