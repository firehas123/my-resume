// Allowed values for the visit counter. Every input from the browser is
// checked against these fixed lists; anything else is rejected, so nobody
// can write arbitrary text into the statistics.

import synced from "@/data/projects.json";
import overridesFile from "@/data/overrides.json";
import { LANGUAGES } from "@/i18n/config";

export const DEVICES = ["phone", "tablet", "desktop"] as const;
export const THEMES = ["dark", "light"] as const;
/** Link clicks that are counted. */
export const LINK_EVENTS = ["linkedin", "github", "ask"] as const;
/**
 * CV downloads, one per CV language: "cv-en", "cv-de", ... Before the site had
 * languages there was only the English CV, counted as "cv"; the stats page
 * adds those to English.
 */
export const CV_EVENTS = LANGUAGES.map((code) => `cv-${code}`);
export const LEGACY_CV_EVENT = "cv";
export const EVENTS: readonly string[] = [...CV_EVENTS, ...LINK_EVENTS];

export type Device = (typeof DEVICES)[number];
export type Theme = (typeof THEMES)[number];
export type TrackEvent = string;

/** Used when the country is missing or not a valid code. */
export const UNKNOWN_COUNTRY = "XX";

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

const projectNames = (synced as { name: string }[]).map((p) => p.name);
const overrideTitles = overridesFile as Record<string, { title?: string | Record<string, string> } | string>;

// Pages are counted without their language (the language has its own
// counter), under the addresses they had before the site had languages, so
// old and new numbers add up.
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
      const raw = typeof override === "object" ? override?.title : undefined;
      // Titles may be written per language; the stats use the English one.
      const title = typeof raw === "string" ? raw : (raw?.en ?? name.replace(/[-_]+/g, " "));
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

/** A page's name without the "Project: " prefix; the stats page words it per language. */
export function pageTitle(path: string): string {
  return pageLabel(path).replace(/^Project: /, "");
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
