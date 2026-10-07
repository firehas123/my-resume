// Formatting helpers for the stats page (browser side), in the language of
// the page: numbers, country names, dates and "3 minutes ago" all come from
// the browser's built-in Intl for that language; the words from
// messages/<code>.json ("stats").

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { languageInfo } from "@/i18n/config";

export type StatsFormat = ReturnType<typeof useStatsFormat>;

export function useStatsFormat() {
  const locale = useLocale();
  const t = useTranslations("stats");
  return useMemo(() => {
    const { intl } = languageInfo(locale);
    const numberFormat = new Intl.NumberFormat(intl);
    const regionNames = typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames([intl], { type: "region" }) : null;
    const relative = new Intl.RelativeTimeFormat(intl, { numeric: "auto" });
    const dayFormat = new Intl.DateTimeFormat(intl, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    const shortDay = new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", timeZone: "UTC" });
    const monthYear = new Intl.DateTimeFormat(intl, { month: "short", year: "numeric", timeZone: "UTC" });
    const weekdayFormat = new Intl.DateTimeFormat(intl, { weekday: "short", timeZone: "UTC" });
    const utc = (day: string) => new Date(`${day}T00:00:00Z`);

    const formatNumber = (n: number) => numberFormat.format(n);

    return {
      t,
      formatNumber,

      /** "DE" -> "Germany" / "Deutschland" / "ألمانيا"; "XX" (unknown) -> "Unknown". */
      countryName(code: string): string {
        if (code === "XX") return t("unknownCountry");
        try {
          return regionNames?.of(code) ?? code;
        } catch {
          return code;
        }
      },

      /** "2026-10-06" -> "6 October 2026" in the page's language. */
      formatDay: (day: string) => dayFormat.format(utc(day)),

      /** A chart bucket's label: "6 Oct", "Week of 6 Oct", "Oct 2026". */
      bucketLabel(start: string, grouping: "day" | "week" | "month"): string {
        if (grouping === "day") return shortDay.format(utc(start));
        if (grouping === "week") return t("weekOf", { date: shortDay.format(utc(start)) });
        return monthYear.format(utc(start));
      },

      /** The bucket label without "Week of", for the narrow axis. */
      axisLabel(start: string, grouping: "day" | "week" | "month"): string {
        return grouping === "month" ? monthYear.format(utc(start)) : shortDay.format(utc(start));
      },

      /** Monday-first short weekday names: "Mon", "Mo.", "lun." ... */
      weekdays: Array.from({ length: 7 }, (_, i) => weekdayFormat.format(utc(`2024-01-0${i + 1}`))),

      /** An ISO time -> "3 minutes ago", "yesterday", ... */
      timeAgo(iso: string, now = Date.now()): string {
        const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
        const abs = Math.abs(seconds);
        if (abs < 45) return t("justNow");
        if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
        if (abs < 86400) return relative.format(Math.round(seconds / 3600), "hour");
        if (abs < 86400 * 30) return relative.format(Math.round(seconds / 86400), "day");
        if (abs < 86400 * 365) return relative.format(Math.round(seconds / (86400 * 30)), "month");
        return relative.format(Math.round(seconds / (86400 * 365)), "year");
      },

      visits: (count: number) => t("visitsCount", { count }),
      pageViews: (count: number) => t("pageViewsCount", { count }),
      countries: (count: number) => t("countriesCount", { count }),
    };
  }, [locale, t]);
}
