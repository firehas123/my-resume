// npm run i18n:add
//
// After adding a language code to "languages" in src/i18n/languages.json:
//   - checks the code has an entry in "catalog" (its name, date format,
//     direction and script),
//   - creates messages/<code>.json if it does not exist yet. It starts empty,
//     so the new language shows English until it is translated (never a
//     blank or a key name),
//   - warns when the language's script has no website font or CV font yet,
//   - then runs the i18n check, which lists everything still to translate.
//
// Removing a language needs no command: delete its code from "languages"
// (its messages file can stay or go).

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const config = JSON.parse(readFileSync(join(ROOT, "src/i18n/languages.json"), "utf8"));

let problems = 0;
for (const code of config.languages) {
  const entry = config.catalog[code];
  if (!entry) {
    console.log(`${code}: not in "catalog" in src/i18n/languages.json. Add its name, intl locale, dir and script there first.`);
    problems += 1;
    continue;
  }
  const file = join(ROOT, "messages", `${code}.json`);
  if (!existsSync(file)) {
    writeFileSync(file, "{}\n");
    console.log(`${code} (${entry.name}): created messages/${code}.json (empty: English is shown until it is translated).`);
  }
  const script = config.scripts[entry.script];
  if (!script) {
    console.log(`${code}: unknown script "${entry.script}"; add it under "scripts".`);
    problems += 1;
    continue;
  }
  if (entry.script !== "latin" && !script.site) {
    console.log(`${code}: the "${entry.script}" script has no website font yet; add one in src/i18n/fonts.ts (see the note there).`);
  }
  if (script.cv) {
    try {
      require.resolve(`${script.cv}/package.json`);
    } catch {
      console.log(`${code}: the CV needs the font package ${script.cv}. Run: npm install -D ${script.cv}`);
      problems += 1;
    }
  }
}

console.log("\nWhat is left to translate:");
try {
  execFileSync(process.execPath, [join(ROOT, "scripts/i18n-check.mjs")], { stdio: "inherit" });
} catch {
  // The check exits with 1 while texts are missing; its list is the to-do list.
}
process.exitCode = problems ? 1 : 0;
