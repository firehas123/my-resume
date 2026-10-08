// Storage layout of the visit counter, shared by the website (API routes)
// and the backup/restore scripts. Plain JavaScript so both can import it.
//
// Everything is aggregated numbers in Upstash Redis. Nothing ever expires
// and old days are never deleted.
//
//   stats:meta            hash   since = first counted day (UTC "YYYY-MM-DD")
//                                last  = time of the most recent view (ISO)
//   stats:total           hash   all-time running totals:
//                                v, pv, c:v:<CC>, c:pv:<CC>, e:<event>
//   stats:day:<YYYY-MM-DD> hash  one per UTC day:
//                                v, pv                 visits, page views
//                                c:v:<CC>, c:pv:<CC>   per country (ISO alpha-2)
//                                p:<path>              views per page path
//                                h:<0-23>, wd:<0-6>    views per hour / weekday
//                                                      (Europe/Berlin; 0 = Monday)
//                                d:<device>            visits per device type
//                                r:<referrer>          visits per referring site
//                                t:<theme>             visits per theme
//                                l:<code>              page views per site language
//                                e:<event>             CV downloads per CV language
//                                                      (cv-en, cv-de, ...; plain
//                                                      "cv" = the English CV from
//                                                      before languages) and link clicks
//   stats:recent          list   the last 25 views: {c: country, p: path, t: time}
//
// A date range is read as one batched request of HGETALL per day, and the
// all-time totals are their own counters, so nothing ever needs a scan.

import { Redis } from "@upstash/redis";
import { DATE_PATTERN, EXPORT_FORMAT, EXPORT_VERSION, validateBackup } from "./stats-backup-check.mjs";

export { EXPORT_FORMAT, EXPORT_VERSION };

export const KEYS = {
  meta: "stats:meta",
  total: "stats:total",
  recent: "stats:recent",
  dayPrefix: "stats:day:",
  day: (date) => `stats:day:${date}`,
};

export const RECENT_LIMIT = 25;

/**
 * Connection details from the environment. Supports both the names the
 * Vercel Redis (Upstash) integration provides (KV_REST_API_URL / _TOKEN)
 * and Upstash's own names (UPSTASH_REDIS_REST_URL / _TOKEN). When the
 * integration was connected with a custom prefix (for example
 * STORAGE_KV_REST_API_URL), the prefixed pair is found as well.
 * Returns null when they are missing; the counter then simply does nothing.
 */
export function redisConfigFromEnv(env = process.env) {
  for (const [urlName, tokenName] of [
    ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
  ]) {
    if (env[urlName] && env[tokenName]) return { url: env[urlName], token: env[tokenName] };
    // Prefixed: <PREFIX>_KV_REST_API_URL with the matching <PREFIX>_KV_REST_API_TOKEN.
    for (const name of Object.keys(env)) {
      if (!name.endsWith(`_${urlName}`) || !env[name]) continue;
      const token = env[name.slice(0, -urlName.length) + tokenName];
      if (token) return { url: env[name], token };
    }
  }
  return null;
}

export function createRedis(env = process.env) {
  const config = redisConfigFromEnv(env);
  return config ? new Redis(config) : null;
}

/** Every key whose name matches the pattern (only used for export/restore). */
async function scanKeys(redis, match) {
  const keys = [];
  let cursor = "0";
  do {
    const [next, batch] = await redis.scan(cursor, { match, count: 1000 });
    keys.push(...batch);
    cursor = String(next);
  } while (cursor !== "0");
  return keys;
}

/** Runs HGETALL for many keys in batched pipeline requests. */
export async function hgetallMany(redis, keys, chunkSize = 500) {
  const results = [];
  for (let i = 0; i < keys.length; i += chunkSize) {
    const pipe = redis.pipeline();
    for (const key of keys.slice(i, i + chunkSize)) pipe.hgetall(key);
    results.push(...(await pipe.exec()));
  }
  return results.map((r) => r ?? {});
}

/** All stored statistics as one plain object (the backup / JSON export). */
export async function exportAll(redis) {
  const dayKeys = (await scanKeys(redis, `${KEYS.dayPrefix}*`))
    .filter((key) => DATE_PATTERN.test(key.slice(KEYS.dayPrefix.length)))
    .sort();
  const [meta, total, ...dayHashes] = await hgetallMany(redis, [KEYS.meta, KEYS.total, ...dayKeys]);
  const recent = (await redis.lrange(KEYS.recent, 0, -1)) ?? [];
  const days = {};
  dayKeys.forEach((key, i) => {
    days[key.slice(KEYS.dayPrefix.length)] = dayHashes[i];
  });
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    meta,
    total,
    days,
    recent,
  };
}

/** CSV with one row per day and country: date,country,visits,pageviews. */
export function exportToCsv(data) {
  const rows = ["date,country,visits,pageviews"];
  for (const date of Object.keys(data.days).sort()) {
    const fields = data.days[date];
    const countries = new Set(
      Object.keys(fields)
        .filter((f) => f.startsWith("c:v:") || f.startsWith("c:pv:"))
        .map((f) => f.split(":")[2]),
    );
    for (const country of [...countries].sort()) {
      rows.push(`${date},${country},${Number(fields[`c:v:${country}`] ?? 0)},${Number(fields[`c:pv:${country}`] ?? 0)}`);
    }
  }
  return rows.join("\n") + "\n";
}

/** True when no statistics are stored yet. */
export async function isEmpty(redis) {
  const [cursor, keys] = await redis.scan("0", { match: "stats:*", count: 1000 });
  return keys.length === 0 && String(cursor) === "0";
}

/**
 * Loads a backup into an EMPTY database. Refuses to touch a database that
 * already holds statistics, so it can never overwrite or double counts.
 */
export async function restoreAll(redis, data) {
  validateBackup(data);
  if (!(await isEmpty(redis))) {
    throw new Error("The database already contains statistics. Restore only works on an empty database.");
  }
  const writes = [];
  const hashWrite = (key, fields) => {
    if (fields && Object.keys(fields).length > 0) writes.push((pipe) => pipe.hset(key, fields));
  };
  hashWrite(KEYS.meta, data.meta);
  hashWrite(KEYS.total, data.total);
  for (const [date, fields] of Object.entries(data.days ?? {})) hashWrite(KEYS.day(date), fields);
  // Stored newest first; RPUSH in the same order keeps that order.
  const recent = (data.recent ?? []).slice(0, RECENT_LIMIT).map((r) => JSON.stringify(r));
  if (recent.length) writes.push((pipe) => pipe.rpush(KEYS.recent, ...recent));
  for (let i = 0; i < writes.length; i += 200) {
    const pipe = redis.pipeline();
    for (const write of writes.slice(i, i + 200)) write(pipe);
    await pipe.exec();
  }
  return { days: Object.keys(data.days ?? {}).length, recent: recent.length };
}
