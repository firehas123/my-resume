// Typed access to src/i18n/languages.json, the one list of languages.
// Everything else (routing, fonts, menus, sitemap, CVs, stats) reads it from here.

import config from "./languages.json";

type CatalogEntry = { name: string; intl: string; dir: string; script: string; letters?: boolean; cvDates?: string; lowerRoles?: boolean };

/** A configured language code, e.g. "de". */
export type Locale = string;

export const LANGUAGES = config.languages as Locale[];
export const PRIMARY = config.primary as Locale[];
export const DEFAULT_LOCALE = config.default as Locale;
/** Languages the Legal Notice and Privacy Policy are written in. */
export const LEGAL_LANGUAGES = config.legal as Locale[];

const catalog = config.catalog as Record<string, CatalogEntry>;
export const CATALOG_CODES = new Set(Object.keys(catalog));

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LANGUAGES.includes(value);
}

/** Everything the site needs to know about one language. */
export function languageInfo(locale: Locale) {
  const entry = catalog[locale] ?? catalog[DEFAULT_LOCALE];
  return {
    code: locale,
    /** The language in its own name, e.g. "Deutsch". */
    name: entry.name,
    /** Locale for Intl date and number formatting, e.g. "de-DE". */
    intl: entry.intl,
    dir: entry.dir === "rtl" ? ("rtl" as const) : ("ltr" as const),
    script: entry.script,
    /** Whether headlines may be animated letter by letter (not for joined scripts). */
    letters: entry.letters !== false,
    /** Job titles are Title Case in the data; lower them inside a sentence (English). */
    lowerRoles: entry.lowerRoles === true,
    /** Primary languages are the ones I work in; the rest are convenience translations. */
    primary: PRIMARY.includes(locale),
    /** Whether the legal pages exist in this language (otherwise English is used). */
    hasLegal: LEGAL_LANGUAGES.includes(locale),
  };
}

export type LanguageInfo = ReturnType<typeof languageInfo>;
