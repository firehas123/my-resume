// Reads the counters for a date range and adds them up for the stats page.
// One batched request reads every day hash in the range plus the all-time
// totals, the meta data and the recent views.

import type { Redis } from "@upstash/redis";
import { KEYS, hgetallMany } from "../../../scripts/lib/stats-store.mjs";
import { LANGUAGES } from "@/i18n/config";
import { DEVICES, LEGACY_CV_EVENT, LINK_EVENTS, THEMES, pageTitle } from "./config";
import { addDays, datesBetween, utcDate } from "./time";

export const RANGES = ["today", "7d", "30d", "90d", "12m", "all"] as const;
export type Range = (typeof RANGES)[number];

const RANGE_DAYS: Record<Exclude<Range, "all">, number> = { today: 1, "7d": 7, "30d": 30, "90d": 90, "12m": 365 };

export type Bucket = { start: string; label: string; visits: number; pageViews: number };
/**
 * One row of a ranked list. `key` is what was counted (a page path, a
 * language code, "phone", ...); the stats page turns it into words in its
 * own language. `label` is an English name, used for project titles.
 */
export type Ranked = { key: string; label: string; count: number };

export type StatsSummary = {
  connected: true;
  range: Range;
  from: string;
  to: string;
  since: string | null;
  lastViewed: string | null;
  totals: { visits: number; pageViews: number; countries: number };
  allTime: { visits: number; pageViews: number };
  grouping: "day" | "week" | "month";
  series: Bucket[];
  countries: { code: string; visits: number; pageViews: number }[];
  hours: number[]; // 24 entries, Berlin time
  weekdays: number[]; // 7 entries, Monday first
  pages: Ranked[];
  referrers: Ranked[];
  devices: Ranked[];
  themes: Ranked[];
  /** Page views per site language (key: language code). */
  languages: Ranked[];
  /** CV downloads per CV language (key: language code). */
  cvLanguages: Ranked[];
  /** All CV downloads together (key "cv"), then the link clicks. */
  events: Ranked[];
  recent: { country: string; path: string; label: string; time: string }[];
};

type Fields = Record<string, number | string>;
const num = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Monday of the week that contains this date. */
function weekStart(day: string): string {
  const weekday = (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7; // 0 = Monday
  return addDays(day, -weekday);
}

function bucketOf(day: string, grouping: StatsSummary["grouping"]): { start: string; label: string } {
  const [y, m, d] = day.split("-").map(Number);
  if (grouping === "day") return { start: day, label: `${d} ${MONTHS[m - 1]}` };
  if (grouping === "week") {
    const start = weekStart(day);
    const [, wm, wd] = start.split("-").map(Number);
    return { start, label: `Week of ${wd} ${MONTHS[wm - 1]}` };
  }
  return { start: `${y}-${String(m).padStart(2, "0")}-01`, label: `${MONTHS[m - 1]} ${y}` };
}

/** Short ranges by day, medium by week, long by month, so charts stay readable. */
function groupingFor(dayCount: number): StatsSummary["grouping"] {
  if (dayCount <= 31) return "day";
  if (dayCount <= 120) return "week";
  return "month";
}

function ranked(map: Map<string, number>, label: (key: string) => string = (k) => k): Ranked[] {
  return [...map.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([key, count]) => ({ key, label: label(key), count }));
}

export async function getSummary(redis: Redis, range: Range, now = new Date()): Promise<StatsSummary> {
  const today = utcDate(now);
  const [meta, total] = (await hgetallMany(redis, [KEYS.meta, KEYS.total])) as Fields[];
  const since = typeof meta.since === "string" ? meta.since : null;

  const from = range === "all" ? (since && since < today ? since : today) : addDays(today, -(RANGE_DAYS[range] - 1));
  const days = datesBetween(from, today);
  const dayHashes = (await hgetallMany(redis, days.map(KEYS.day))) as Fields[];
  const recentRaw = ((await redis.lrange(KEYS.recent, 0, -1)) ?? []) as { c: string; p: string; t: string }[];

  const grouping = groupingFor(days.length);
  const series = new Map<string, Bucket>();
  const countries = new Map<string, { visits: number; pageViews: number }>();
  const hours = Array<number>(24).fill(0);
  const weekdays = Array<number>(7).fill(0);
  const sums = {
    pages: new Map<string, number>(),
    referrers: new Map<string, number>(),
    devices: new Map<string, number>(),
    themes: new Map<string, number>(),
    languages: new Map<string, number>(),
    events: new Map<string, number>(),
  };
  let visits = 0;
  let pageViews = 0;

  days.forEach((day, i) => {
    const fields = dayHashes[i];
    const { start, label } = bucketOf(day, grouping);
    const bucket = series.get(start) ?? { start, label, visits: 0, pageViews: 0 };
    bucket.visits += num(fields.v);
    bucket.pageViews += num(fields.pv);
    series.set(start, bucket);
    visits += num(fields.v);
    pageViews += num(fields.pv);

    for (const [field, raw] of Object.entries(fields)) {
      const value = num(raw);
      const [kind, a, b] = field.split(":");
      if (kind === "c" && b) {
        const entry = countries.get(b) ?? { visits: 0, pageViews: 0 };
        if (a === "v") entry.visits += value;
        else if (a === "pv") entry.pageViews += value;
        countries.set(b, entry);
      } else if (kind === "h") hours[Number(a)] += value;
      else if (kind === "wd") weekdays[Number(a)] += value;
      else if (kind === "p") sums.pages.set(field.slice(2), (sums.pages.get(field.slice(2)) ?? 0) + value);
      else if (kind === "r") sums.referrers.set(a, (sums.referrers.get(a) ?? 0) + value);
      else if (kind === "d") sums.devices.set(a, (sums.devices.get(a) ?? 0) + value);
      else if (kind === "t") sums.themes.set(a, (sums.themes.get(a) ?? 0) + value);
      else if (kind === "l") sums.languages.set(a, (sums.languages.get(a) ?? 0) + value);
      else if (kind === "e") sums.events.set(a, (sums.events.get(a) ?? 0) + value);
    }
  });

  // Fixed categories always appear (with 0), so the panels keep their shape.
  for (const d of DEVICES) if (!sums.devices.has(d)) sums.devices.set(d, 0);
  for (const t of THEMES) if (!sums.themes.has(t)) sums.themes.set(t, 0);
  // CV downloads per language. The single CV from before the site had
  // languages ("cv") was the English one.
  const cvLanguages = new Map<string, number>(LANGUAGES.map((code) => [code, sums.events.get(`cv-${code}`) ?? 0]));
  cvLanguages.set("en", (cvLanguages.get("en") ?? 0) + (sums.events.get(LEGACY_CV_EVENT) ?? 0));
  const cvTotal = [...cvLanguages.values()].reduce((a, b) => a + b, 0);

  const countryList = [...countries.entries()]
    .map(([code, v]) => ({ code, ...v }))
    .filter((c) => c.visits > 0 || c.pageViews > 0)
    .sort((a, b) => b.visits - a.visits || b.pageViews - a.pageViews || a.code.localeCompare(b.code));

  return {
    connected: true,
    range,
    from,
    to: today,
    since,
    lastViewed: typeof meta.last === "string" ? meta.last : null,
    totals: { visits, pageViews, countries: countryList.filter((c) => c.code !== "XX").length },
    allTime: { visits: num(total.v), pageViews: num(total.pv) },
    grouping,
    series: [...series.values()],
    countries: countryList,
    hours,
    weekdays,
    pages: ranked(sums.pages, pageTitle),
    referrers: ranked(sums.referrers),
    devices: DEVICES.map((d) => ({ key: d, label: d, count: sums.devices.get(d) ?? 0 })),
    themes: THEMES.map((t) => ({ key: t, label: t, count: sums.themes.get(t) ?? 0 })),
    languages: ranked(sums.languages),
    cvLanguages: ranked(cvLanguages),
    events: [
      { key: "cv", label: "cv", count: cvTotal },
      ...LINK_EVENTS.map((e) => ({ key: e, label: e, count: sums.events.get(e) ?? 0 })),
    ],
    recent: recentRaw
      .filter((r) => r && typeof r === "object")
      .map((r) => ({ country: String(r.c), path: String(r.p), label: pageTitle(String(r.p)), time: String(r.t) })),
  };
}
