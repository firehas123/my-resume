// Allowed values for the visit counter. Every input from the browser is
// checked against these fixed lists; anything else is rejected, so nobody
// can write arbitrary text into the statistics.

import synced from "@/data/projects.json";
import overridesFile from "@/data/overrides.json";

export const DEVICES = ["phone", "tablet", "desktop"] as const;
export const THEMES = ["dark", "light"] as const;
export const EVENTS = ["cv", "linkedin", "github", "ask"] as const;

export type Device = (typeof DEVICES)[number];
export type Theme = (typeof THEMES)[number];
export type TrackEvent = (typeof EVENTS)[number];

export const EVENT_LABELS: Record<TrackEvent, string> = {
  cv: "CV downloads",
  linkedin: "LinkedIn clicks",
  github: "GitHub clicks",
  ask: "“Ask me a question” clicks",
};

/** Used when the country is missing or not a valid code. */
export const UNKNOWN_COUNTRY = "XX";

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

const projectNames = (synced as { name: string }[]).map((p) => p.name);
const overrideTitles = overridesFile as Record<string, { title?: string } | string>;

const FIXED_PAGES: Record<string, string> = {
  "/": "Home",
  "/contact": "Contact",
  "/impressum": "Impressum",
  "/datenschutz": "Datenschutz",
};

/** Every page path that may be counted, with a readable label. */
export const PAGE_LABELS: Record<string, string> = {
  ...FIXED_PAGES,
  ...Object.fromEntries(
    projectNames.map((name) => {
      const override = overrideTitles[name];
      const title = typeof override === "object" && override?.title ? override.title : name.replace(/[-_]+/g, " ");
      return [`/projects/${name.toLowerCase()}`, `Project: ${title}`];
    }),
  ),
};

export function isAllowedPath(path: unknown): path is string {
  return typeof path === "string" && Object.hasOwn(PAGE_LABELS, path);
}

export function pageLabel(path: string): string {
  return PAGE_LABELS[path] ?? path;
}

// ---------------------------------------------------------------------------
// Referrers: only the domain is ever looked at, and it is mapped to a fixed
// list. A site that is not on the list is counted as "other".
// ---------------------------------------------------------------------------

const REFERRER_RULES: [RegExp, string][] = [
  [/(^|\.)google\.[a-z.]+$/, "google.com"],
  [/(^|\.)bing\.com$/, "bing.com"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo.com"],
  [/(^|\.)ecosia\.org$/, "ecosia.org"],
  [/(^|\.)yahoo\.[a-z.]+$/, "yahoo.com"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "linkedin.com"],
  [/(^|\.)github\.com$|(^|\.)github\.io$/, "github.com"],
  [/(^|\.)xing\.com$/, "xing.com"],
  [/(^|\.)(twitter|x)\.com$|^t\.co$/, "x.com"],
  [/(^|\.)facebook\.com$|^fb\.me$/, "facebook.com"],
  [/(^|\.)instagram\.com$/, "instagram.com"],
  [/(^|\.)reddit\.com$/, "reddit.com"],
  [/(^|\.)youtube\.com$|^youtu\.be$/, "youtube.com"],
  [/(^|\.)stackoverflow\.com$/, "stackoverflow.com"],
  [/^news\.ycombinator\.com$/, "news.ycombinator.com"],
  [/(^|\.)fiverr\.com$/, "fiverr.com"],
  [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$/, "chatgpt.com"],
  [/(^|\.)claude\.ai$/, "claude.ai"],
  [/(^|\.)perplexity\.ai$/, "perplexity.ai"],
];

export const REFERRERS = [...new Set(REFERRER_RULES.map(([, name]) => name)), "other", "direct"] as const;

/** A referring host name (domain only) -> one of REFERRERS. Empty = "direct". */
export function normalizeReferrer(host: unknown): string | null {
  if (host === undefined || host === null || host === "") return "direct";
  if (typeof host !== "string" || host.length > 253 || !/^[a-z0-9.-]+$/i.test(host)) return null;
  const domain = host.toLowerCase().replace(/^www\./, "");
  for (const [pattern, name] of REFERRER_RULES) if (pattern.test(domain)) return name;
  return "other";
}

/** Two-letter ISO country code from Vercel's header, or "XX" when unknown. */
export function normalizeCountry(value: string | null): string {
  return value && /^[A-Z]{2}$/.test(value) && value !== "XX" ? value : UNKNOWN_COUNTRY;
}

export function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}
