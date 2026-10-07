// How addresses carry the language (next-intl). Every page lives under its
// language code (/en/contact, /de/contact, /ar/projects/x). Only the legal
// pages have German names of their own (/de/impressum, /de/datenschutz).

import { defineRouting } from "next-intl/routing";
import { DEFAULT_LOCALE, LANGUAGES } from "./config";

/** Name of the cookie that remembers a language chosen in the menu. */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const routing = defineRouting({
  locales: LANGUAGES,
  defaultLocale: DEFAULT_LOCALE,
  // Always /en/..., /de/..., so every address says which language it is in.
  localePrefix: "always",
  // A visitor who picks a language in the menu gets it again next time
  // (the cookie holds only the language code, e.g. "de", for one year).
  localeCookie: { name: LOCALE_COOKIE, maxAge: 60 * 60 * 24 * 365 },
  // hreflang alternates are written into each page's <head> (see lib/seo.ts).
  alternateLinks: false,
  pathnames: {
    "/": "/",
    "/contact": "/contact",
    "/stats": "/stats",
    "/projects/[slug]": "/projects/[slug]",
    "/legal-notice": { en: "/legal-notice", de: "/impressum" },
    "/privacy": { en: "/privacy", de: "/datenschutz" },
  },
});

export type AppPathname = keyof typeof routing.pathnames;
