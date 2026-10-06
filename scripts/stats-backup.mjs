#!/usr/bin/env node
// npm run stats:backup
// Saves every stored statistic to data/stats-backup/<YYYY-MM-DD>.json, so a
// copy can be committed to the repo. Restore it with `npm run stats:restore`.
//
// Needs the database connection in the environment or in .env.local
// (get it with: npx vercel env pull .env.local).

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFiles } from "./lib/load-env.mjs";
import { createRedis, exportAll } from "./lib/stats-store.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnvFiles(root);

const redis = createRedis();
if (!redis) {
  console.error(
    "stats:backup: no database connection found. Set KV_REST_API_URL and KV_REST_API_TOKEN\n" +
      "(or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN), for example with:\n" +
      "  npx vercel env pull .env.local",
  );
  process.exit(1);
}

const data = await exportAll(redis);
const dir = join(root, "data", "stats-backup");
mkdirSync(dir, { recursive: true });
const file = join(dir, `${data.exportedAt.slice(0, 10)}.json`);
writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
const days = Object.keys(data.days).length;
console.log(`stats:backup: saved ${days} day${days === 1 ? "" : "s"} of statistics to ${relative(root, file)}`);
