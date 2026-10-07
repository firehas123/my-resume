import { test } from "node:test";
import assert from "node:assert/strict";
import { redisConfigFromEnv } from "./lib/stats-store.mjs";

test("finds Upstash's own variable names", () => {
  assert.deepEqual(redisConfigFromEnv({ UPSTASH_REDIS_REST_URL: "u", UPSTASH_REDIS_REST_TOKEN: "t" }), { url: "u", token: "t" });
});

test("finds the Vercel integration's names", () => {
  assert.deepEqual(redisConfigFromEnv({ KV_REST_API_URL: "u", KV_REST_API_TOKEN: "t" }), { url: "u", token: "t" });
});

test("finds names with a custom prefix", () => {
  assert.deepEqual(redisConfigFromEnv({ STORAGE_KV_REST_API_URL: "u", STORAGE_KV_REST_API_TOKEN: "t" }), { url: "u", token: "t" });
});

test("needs the matching token, not just any", () => {
  assert.equal(redisConfigFromEnv({ A_KV_REST_API_URL: "u", B_KV_REST_API_TOKEN: "t" }), null);
  assert.equal(redisConfigFromEnv({}), null);
});
