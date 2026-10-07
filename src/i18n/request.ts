// Loads the interface texts for the language of the current page.
// English (messages/en.json) is the base; a language's own file only has to
// contain what it translates. Anything missing shows the English text, so a
// visitor never sees a blank or a key name.

import * as rootParams from "next/root-params";
import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { mergeMessages } from "../../scripts/lib/i18n.mjs";
import { DEFAULT_LOCALE, isLocale } from "./config";
import english from "../../messages/en.json";

export type Messages = typeof english;

/** The messages for one language, completed with English. */
export async function loadMessages(locale: string): Promise<Messages> {
  if (locale === DEFAULT_LOCALE) return english;
  // A language added to the config before its file exists simply shows English.
  const own = await import(`../../messages/${locale}.json`).then((m) => m.default).catch(() => ({}));
  return mergeMessages(english, own) as Messages;
}

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const fromUrl = await rootParams.locale();
    if (!isLocale(fromUrl)) notFound();
    locale = fromUrl;
  }
  return {
    locale,
    messages: await loadMessages(locale),
    timeZone: "Europe/Berlin",
    // The English fallback above means a missing key is a bug in en.json;
    // show the key's last part instead of crashing, and log it while developing.
    onError(error) {
      if (process.env.NODE_ENV !== "production") console.error(error.message);
    },
    getMessageFallback({ key }) {
      return key.split(".").pop() ?? key;
    },
  };
});
