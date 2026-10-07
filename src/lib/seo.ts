// Absolute page addresses in every language, for <link rel="alternate"
// hreflang> in each page's <head> and for the sitemap.

import type { Metadata } from "next";
import { DEFAULT_LOCALE, LANGUAGES, type Locale } from "@/i18n/config";
import { getPathname } from "@/i18n/navigation";
import { siteUrl } from "./site";

type Href = Parameters<typeof getPathname>[0]["href"];

/** The absolute URL of a page in one language. */
export function absoluteUrl(href: Href, locale: Locale): string {
  return new URL(getPathname({ href, locale }), siteUrl()).toString();
}

/** hreflang alternates for every language, plus x-default (English). */
export function languageAlternates(href: Href, languages: Locale[] = LANGUAGES): Record<string, string> {
  const entries = languages.map((locale) => [locale, absoluteUrl(href, locale)]);
  return Object.fromEntries([...entries, ["x-default", absoluteUrl(href, DEFAULT_LOCALE)]]);
}

/** The `alternates` part of a page's metadata: its own canonical address and all languages. */
export function alternates(href: Href, locale: Locale, languages?: Locale[]): Metadata["alternates"] {
  return { canonical: absoluteUrl(href, locale), languages: languageAlternates(href, languages) };
}
