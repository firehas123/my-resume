// Loads KEY=value lines from .env.local and .env (if present) into
// process.env, without overwriting variables that are already set.
// Values are never printed. Get these files with `npx vercel env pull .env.local`.

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export function loadEnvFiles(root) {
  for (const name of [".env.local", ".env"]) {
    const file = join(root, name);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/i.exec(line);
      if (!match || line.trimStart().startsWith("#")) continue;
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (process.env[match[1]] === undefined) process.env[match[1]] = value;
    }
  }
}
