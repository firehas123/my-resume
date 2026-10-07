// The downloadable CVs: one PDF per language, built by `npm run cv` into
// public/files/cv-<code>.pdf. A Europass CV is offered as well when the file
// public/files/europass-cv-<code>.pdf exists (those are made by hand, never
// generated). Server only: it looks at the files on disk at build time.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { LANGUAGES, languageInfo, type Locale } from "@/i18n/config";
import { loadMessages } from "@/i18n/request";
import { profileFor } from "./profile";

export type CvFile = {
  /** Language of the CV, e.g. "de". */
  code: Locale;
  /** That language in its own name, e.g. "Deutsch". */
  name: string;
  href: string;
  /** File name the browser saves it as. */
  fileName: string;
  /** Click name for the site's own statistics (see VisitTracker). */
  track: string;
};

export const cvPath = (code: Locale) => `/files/cv-${code}.pdf`;
export const europassPath = (code: Locale) => `/files/europass-cv-${code}.pdf`;

async function cvFile(code: Locale, href: string, suffix: string): Promise<CvFile> {
  const messages = await loadMessages(code);
  // "{name}-CV" in English, "{name}-Lebenslauf" in German, with spaces as dashes.
  const base = messages.cv.fileName.replace("{name}", profileFor(code).name).replace(/\s+/g, "-");
  return { code, name: languageInfo(code).name, href, fileName: `${base}${suffix}-${code}.pdf`, track: `cv-${code}` };
}

/** The CV in the page's language first, then every other language, then any Europass CVs. */
export async function cvFiles(locale: Locale) {
  const current = await cvFile(locale, cvPath(locale), "");
  const others = await Promise.all(LANGUAGES.filter((code) => code !== locale).map((code) => cvFile(code, cvPath(code), "")));
  const europass = await Promise.all(
    LANGUAGES.filter((code) => existsSync(join(process.cwd(), "public", europassPath(code)))).map((code) =>
      cvFile(code, europassPath(code), "-Europass"),
    ),
  );
  return { current, others, europass };
}
