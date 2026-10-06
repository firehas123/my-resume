// Date helpers for the visit counter.
// Days are stored by UTC date; "when people visit" uses Berlin time.

/** "YYYY-MM-DD" in UTC. */
export function utcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Adds whole days to a "YYYY-MM-DD" date (negative to go back). */
export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return utcDate(d);
}

/** Every date from start to end inclusive ("YYYY-MM-DD"). */
export function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

const berlinParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Berlin",
  hour: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Hour of day (0-23) and weekday (0 = Monday ... 6 = Sunday) in Berlin. */
export function berlinHourAndWeekday(date: Date): { hour: number; weekday: number } {
  const parts = berlinParts.formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const weekday = WEEKDAYS.indexOf(parts.find((p) => p.type === "weekday")?.value ?? "Mon");
  return { hour: hour % 24, weekday: Math.max(0, weekday) };
}
