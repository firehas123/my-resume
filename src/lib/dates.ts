// Month ranges and job lengths in the language of the page. The words come
// from messages/<code>.json ("dates"), the month names and number formats
// from the browser's built-in Intl, so every language gets its own
// typography without a list of month names per language.

type Translate = (key: string, values?: Record<string, string | number>) => string;

const monthFormats = new Map<string, Intl.DateTimeFormat>();

/** "2024-12" -> "Dec 2024" (en), "Dez. 2024" (de), "déc. 2024" (fr). Anything else is shown as is. */
export function formatMonth(value: string, intl: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;
  let format = monthFormats.get(intl);
  if (!format) {
    format = new Intl.DateTimeFormat(intl, { month: "short", year: "numeric", timeZone: "UTC" });
    monthFormats.set(intl, format);
  }
  return format.format(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
}

/** "Dec 2024 to present", "Jul 2018 to Jul 2022"; `t` is the "dates" translator. */
export function formatRange(start: string, end: string | null, intl: string, t: Translate): string {
  const isPresent = end === null || end === "present";
  return t("range", { start: formatMonth(start, intl), end: isPresent ? t("present") : formatMonth(end, intl) });
}

/**
 * Length of a job, counting both the first and the last month, the way
 * LinkedIn does: "1 yr 6 mos", "3 mos", "2 yrs". A missing end means "until
 * now" (the date the site was built).
 */
export function formatDuration(start: string, end: string | null, intl: string, t: Translate, now = new Date()): string {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end && /^\d{4}-\d{2}$/.test(end) ? end.split("-").map(Number) : [now.getUTCFullYear(), now.getUTCMonth() + 1];
  const months = Math.max(1, ey * 12 + em - (sy * 12 + sm) + 1);
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years) parts.push(t("years", { count: years }));
  if (rest) parts.push(t("months", { count: rest }));
  // Joined the way the language joins units ("1 yr 6 mos", "1 an et 6 mois").
  return new Intl.ListFormat(intl, { style: "narrow", type: "unit" }).format(parts);
}
