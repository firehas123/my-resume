// Copies the Devicon logos named in src/data/profile.json (and the project
// platform marks from src/data/overrides.json) into public/skill-icons/
// (not committed), so they are served as plain static files and the server
// functions don't carry the whole 102 MB icon package. Runs before dev and build.
// A logo name that doesn't exist in Devicon stops the build here.

import { copyFileSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { platformLogos } from "./lib/platforms.mjs";

const ROOT = process.cwd();
const profile = JSON.parse(readFileSync(join(ROOT, "src", "data", "profile.json"), "utf8"));
const overrides = JSON.parse(readFileSync(join(ROOT, "src", "data", "overrides.json"), "utf8"));
// Skill logos, plus the platform marks of projects ("platforms" in overrides.json).
const names = [...new Set([...profile.skills.flatMap((skill) => skill.logos ?? []), ...platformLogos(overrides)])];

const target = join(ROOT, "public", "skill-icons");
rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
for (const name of names) {
  // The part before the first "-" is the folder in the Devicon package.
  copyFileSync(join(ROOT, "node_modules", "devicon", "icons", name.split("-")[0], `${name}.svg`), join(target, `${name}.svg`));
}
console.log(`Copied ${names.length} skill logos to public/skill-icons/`);
