// Helpers for texts that exist in several languages. Plain JavaScript and
// pure functions, so the website (TypeScript), the CV script and the
// i18n check all share them. Tested in scripts/i18n.test.mjs.
//
// A text in profile.json or overrides.json is either
//   - a plain string (the same in every language: names, links, codes), or
//   - an object with one entry per language code: { "en": "...", "de": "..." }.
// "en" is the source and must always be there. A language without its own
// entry falls back to English, never to an empty text.

/** Language codes that may appear as keys of a translated text. */
export function knownCodes(config) {
  return new Set(Object.keys(config.catalog));
}

/** True for { "en": ..., "de": ... }: an object keyed only by language codes, with "en". */
export function isLocalized(value, codes) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.includes("en") && keys.every((key) => codes.has(key));
}

/**
 * Picks one language everywhere in a value (deeply): every translated text
 * becomes the text in `locale`, or English when that language has none.
 */
export function localize(value, locale, codes, fallback = "en") {
  if (isLocalized(value, codes)) {
    const picked = value[locale] ?? value[fallback];
    return localize(picked, locale, codes, fallback);
  }
  if (Array.isArray(value)) return value.map((item) => localize(item, locale, codes, fallback));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localize(item, locale, codes, fallback)]));
  }
  return value;
}

/** Which language a single translated text is actually shown in. */
export function shownLanguage(value, locale, codes, fallback = "en") {
  if (!isLocalized(value, codes)) return null; // the same in every language
  return value[locale] !== undefined ? locale : fallback;
}

/**
 * Every translated text in a value that is missing in, or identical to the
 * English of, one of the given languages. Used by `npm run i18n:check`.
 * Returns [{ path, locale, problem: "missing" | "same as English" }].
 */
export function translationGaps(value, languages, codes, path = "") {
  const gaps = [];
  if (isLocalized(value, codes)) {
    for (const locale of languages) {
      if (locale === "en") continue;
      const text = value[locale];
      if (text === undefined || text === "" || (Array.isArray(text) && text.length === 0)) {
        gaps.push({ path, locale, problem: "missing" });
      } else if (JSON.stringify(text) === JSON.stringify(value.en)) {
        gaps.push({ path, locale, problem: "same as English" });
      }
    }
    return gaps;
  }
  if (Array.isArray(value)) {
    value.forEach((item, i) => gaps.push(...translationGaps(item, languages, codes, `${path}[${i}]`)));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (key.startsWith("_")) continue; // notes, not content
      gaps.push(...translationGaps(item, languages, codes, path ? `${path}.${key}` : key));
    }
  }
  return gaps;
}

/**
 * Message files (messages/<code>.json): every key of the English file that
 * is missing in, or identical to, another language's file.
 */
export function messageGaps(english, other, path = "") {
  const gaps = [];
  for (const [key, value] of Object.entries(english)) {
    const here = path ? `${path}.${key}` : key;
    const theirs = other?.[key];
    if (value && typeof value === "object") {
      gaps.push(...messageGaps(value, theirs && typeof theirs === "object" ? theirs : undefined, here));
    } else if (theirs === undefined || theirs === "") {
      gaps.push({ path: here, problem: "missing" });
    } else if (theirs === value && /\p{L}/u.test(String(value).replace(/\{[^{}]*\}/g, ""))) {
      // (Only text with words of its own counts; "{start} – {end}" has none.)
      gaps.push({ path: here, problem: "same as English" });
    }
  }
  return gaps;
}

/** Deep merge for message files: `override` wins, `base` fills the gaps. */
export function mergeMessages(base, override) {
  if (!override || typeof override !== "object") return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value === "" || value === undefined || value === null) continue; // never a blank
    out[key] =
      value && typeof value === "object" && !Array.isArray(value) && base?.[key] && typeof base[key] === "object"
        ? mergeMessages(base[key], value)
        : value;
  }
  return out;
}
