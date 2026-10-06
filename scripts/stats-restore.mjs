#!/usr/bin/env node
// npm run stats:restore <file>
// Loads a backup made by `npm run stats:backup` (or the JSON download on
// /stats) into an EMPTY database, so the history survives if the database
// is ever lost or replaced. It refuses to write into a database that already
// holds statistics, so counts can never be overwritten or doubled.

import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFiles } from "./lib/load-env.mjs";
import { createRedis, restoreAll } from "./lib/stats-store.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnvFiles(root);

const fileArg = process.argv[2];
if (!fileArg) {
  console.error("Usage: npm run stats:restore <backup-file.json>");
  process.exit(1);
}

const redis = createRedis();
if (!redis) {
  console.error("stats:restore: no database connection found (see `npm run stats:backup` for how to set it up).");
  process.exit(1);
}

try {
  const data = JSON.parse(readFileSync(resolve(fileArg), "utf8"));
  const result = await restoreAll(redis, data);
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  console.log(`stats:restore: loaded ${plural(result.days, "day")} and ${plural(result.recent, "recent view")} from ${fileArg}.`);
} catch (error) {
  console.error(`stats:restore: ${error.message}`);
  process.exit(1);
}
