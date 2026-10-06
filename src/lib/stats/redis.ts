// The Redis client for the visit counter, or null when the database is not
// connected yet (environment variables missing). Callers must handle null:
// the site keeps working and the counter simply does nothing.

import type { Redis } from "@upstash/redis";
import { createRedis } from "../../../scripts/lib/stats-store.mjs";

let client: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (client === undefined) client = createRedis(process.env) as Redis | null;
  return client;
}
