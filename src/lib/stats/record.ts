// Writes one page view or event into the counters.
// Every write is an atomic increment inside a single MULTI transaction, so
// simultaneous visits can never corrupt the numbers. Nothing ever expires.
// Only aggregated numbers are stored: no IP address, no user agent, no
// identifier of any kind.

import type { Redis } from "@upstash/redis";
import { KEYS, RECENT_LIMIT } from "../../../scripts/lib/stats-store.mjs";
import type { Device, Theme, TrackEvent } from "./config";
import { berlinHourAndWeekday, utcDate } from "./time";

export type ViewInput = {
  country: string;
  path: string;
  /** First page of a full load in a browser tab: also counts as a visit. */
  newVisit: boolean;
  device?: Device;
  theme?: Theme;
  referrer?: string;
};

export async function recordView(redis: Redis, input: ViewInput, now = new Date()) {
  const day = KEYS.day(utcDate(now));
  const { hour, weekday } = berlinHourAndWeekday(now);
  const { country, path } = input;

  const tx = redis.multi();
  // Page view counters
  tx.hincrby(day, "pv", 1);
  tx.hincrby(day, `c:pv:${country}`, 1);
  tx.hincrby(day, `p:${path}`, 1);
  tx.hincrby(day, `h:${hour}`, 1);
  tx.hincrby(day, `wd:${weekday}`, 1);
  tx.hincrby(KEYS.total, "pv", 1);
  tx.hincrby(KEYS.total, `c:pv:${country}`, 1);
  // Visit counters (first page of a tab only)
  if (input.newVisit) {
    tx.hincrby(day, "v", 1);
    tx.hincrby(day, `c:v:${country}`, 1);
    tx.hincrby(KEYS.total, "v", 1);
    tx.hincrby(KEYS.total, `c:v:${country}`, 1);
    if (input.device) tx.hincrby(day, `d:${input.device}`, 1);
    if (input.theme) tx.hincrby(day, `t:${input.theme}`, 1);
    if (input.referrer) tx.hincrby(day, `r:${input.referrer}`, 1);
  }
  // When counting started (set once) and the most recent view
  tx.hsetnx(KEYS.meta, "since", utcDate(now));
  tx.hset(KEYS.meta, { last: now.toISOString() });
  // The last 25 views: country, page and time only
  tx.lpush(KEYS.recent, JSON.stringify({ c: country, p: path, t: now.toISOString() }));
  tx.ltrim(KEYS.recent, 0, RECENT_LIMIT - 1);
  await tx.exec();
}

export async function recordEvent(redis: Redis, event: TrackEvent, now = new Date()) {
  const tx = redis.multi();
  tx.hincrby(KEYS.day(utcDate(now)), `e:${event}`, 1);
  tx.hincrby(KEYS.total, `e:${event}`, 1);
  tx.hsetnx(KEYS.meta, "since", utcDate(now));
  await tx.exec();
}
