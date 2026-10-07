// Turns an address into what the visit counter stores: the page without its
// language ("/de/contact" -> "/contact") and the language on its own ("de").
// The legal pages keep the names they always had in the statistics
// ("/impressum", "/datenschutz"), whatever language they are viewed in.
// Used in the browser by VisitTracker; the server checks the result against
// the fixed lists in config.ts.

import { isLocale } from "@/i18n/config";

const LEGAL: Record<string, string> = {
  "/legal-notice": "/impressum",
  "/impressum": "/impressum",
  "/privacy": "/datenschutz",
  "/datenschutz": "/datenschutz",
};

export function statsPath(pathname: string): { path: string; lang: string | null } {
  const [, first, ...rest] = pathname.split("/");
  if (!isLocale(first)) return { path: pathname, lang: null };
  const path = `/${rest.join("/")}`.replace(/\/$/, "") || "/";
  return { path: LEGAL[path] ?? path, lang: first };
}
