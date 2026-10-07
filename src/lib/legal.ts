// The Legal Notice and the Privacy Policy, written as Markdown in
// content/legal/<code>/ (English and German, see "legal" in
// src/i18n/languages.json). Placeholders like {{street}} are filled in from
// profile.json, so the address is kept in one place only.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { marked } from "marked";
import type { Locale } from "@/i18n/config";
import { getPathname } from "@/i18n/navigation";
import { contactSetup } from "./contact";
import { profileFor } from "./profile";

export type LegalPageName = "legal-notice" | "privacy";

export async function legalHtml(page: LegalPageName, locale: Locale): Promise<string> {
  const markdown = readFileSync(join(process.cwd(), "content", "legal", locale, `${page}.md`), "utf8");
  const profile = profileFor(locale);
  const values: Record<string, string> = {
    name: profile.name,
    ...profile.postalAddress,
    contactUrl: getPathname({ href: "/contact", locale }),
  };
  // Passages that depend on how the contact form sends (lib/contact.ts) are
  // marked <!-- form:server --> ... <!-- /form --> or <!-- form:web3forms -->
  // ... <!-- /form -->; only the ones for the current setup are kept.
  const mode = contactSetup().mode;
  const forSetup = markdown.replace(/<!-- form:(\w+) -->([\s\S]*?)<!-- \/form -->/g, (_, which: string, text: string) =>
    which === mode ? text.trim() : "",
  );
  const filled = forSetup.replace(/\{\{(\w+)\}\}/g, (match, key: string) => values[key] ?? match);
  // breaks: a single line break is a line break (the postal address).
  return marked.parse(filled, { async: true, breaks: true });
}
