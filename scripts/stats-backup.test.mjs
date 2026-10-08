import { test } from "node:test";
import assert from "node:assert/strict";
import { backupProblems } from "./lib/stats-backup-check.mjs";
import { restoreAll } from "./lib/stats-store.mjs";

const backup = (days = 2, visits = 10) => ({
  format: "resume-site-stats",
  version: 1,
  exportedAt: "2026-10-12T03:23:00.000Z",
  meta: { since: "2026-10-07", last: "2026-10-11T20:00:00.000Z" },
  total: { v: String(visits), pv: String(visits * 2), "c:v:DE": String(visits) },
  days: Object.fromEntries(Array.from({ length: days }, (_, i) => [`2026-10-${String(7 + i).padStart(2, "0")}`, { v: "5", pv: "10", "c:v:DE": "5" }])),
  recent: [{ c: "DE", p: "/en", t: "2026-10-11T20:00:00.000Z" }],
});

test("a complete backup passes", () => {
  assert.deepEqual(backupProblems(backup()), []);
});

test("wrong format, wrong version or not JSON-like is rejected", () => {
  assert.match(backupProblems({ ...backup(), format: "other" })[0], /Not a resume-site-stats/);
  assert.match(backupProblems({ ...backup(), version: 2 })[0], /Unsupported backup version/);
  assert.equal(backupProblems(null).length, 1);
  assert.equal(backupProblems({ error: "The statistics database is not connected yet." }).length, 1);
});

test("an empty backup is rejected", () => {
  assert.ok(backupProblems({ ...backup(), days: {} }).some((p) => /no days/.test(p)));
  assert.ok(backupProblems({ ...backup(), meta: {} }).some((p) => /meta.since/.test(p)));
});

test("never less than the previous backup", () => {
  assert.deepEqual(backupProblems(backup(3, 12), backup(2, 10)), []);
  assert.ok(backupProblems(backup(1, 12), backup(2, 10)).some((p) => /Fewer days/.test(p)));
  assert.ok(backupProblems(backup(2, 3), backup(2, 10)).some((p) => /Fewer all-time visits/.test(p)));
});

// `npm run stats:restore` with such a file, against an in-memory stand-in
// for the database (the real one is never touched by tests).
function memoryRedis() {
  const hashes = new Map();
  const lists = new Map();
  const redis = {
    hashes,
    lists,
    scan: async () => ["0", [...hashes.keys(), ...lists.keys()]],
    pipeline() {
      const ops = [];
      const pipe = {
        hset: (key, fields) => (ops.push(() => hashes.set(key, { ...(hashes.get(key) ?? {}), ...fields })), pipe),
        rpush: (key, ...values) => (ops.push(() => lists.set(key, [...(lists.get(key) ?? []), ...values])), pipe),
        exec: async () => ops.forEach((op) => op()),
      };
      return pipe;
    },
  };
  return redis;
}

test("stats:restore loads a workflow backup into an empty database", async () => {
  const redis = memoryRedis();
  const file = JSON.parse(JSON.stringify(backup(2, 10))); // as read from disk
  assert.deepEqual(await restoreAll(redis, file), { days: 2, recent: 1 });
  assert.equal(redis.hashes.get("stats:total").v, "10");
  assert.equal(redis.hashes.get("stats:meta").since, "2026-10-07");
  assert.ok(redis.hashes.has("stats:day:2026-10-08"));
  assert.equal(redis.lists.get("stats:recent").length, 1);
});

test("stats:restore still refuses a database that already has statistics", async () => {
  const redis = memoryRedis();
  redis.hashes.set("stats:total", { v: "1" });
  await assert.rejects(restoreAll(redis, backup()), /already contains statistics/);
});
