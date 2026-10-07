// Runs before every page request (Next.js "proxy", formerly middleware).
//
// - An address without a language (/, /contact, /projects/x, ...) is sent to
//   the visitor's language: the one they picked before in the language menu
//   (cookie), else the best match for their browser language, else English.
// - The legal pages exist in English and German only; in any other language
//   they lead to the English versions.
// - The language cookie is only ever set by the language menu itself (in the
//   browser, when a language is picked). next-intl would also set it here
//   whenever someone opens a page in a language their browser does not
//   prefer, for example through a shared link; that is removed, so the
//   cookie only remembers a choice the visitor actually made.
// Everything else is next-intl's standard behaviour.

import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { LEGAL_LANGUAGES, isLocale } from "./i18n/config";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

// Every spelling of the legal pages, in any language -> the English address.
const LEGAL_PAGES: Record<string, string> = {
  "legal-notice": "/legal-notice",
  impressum: "/legal-notice",
  privacy: "/privacy",
  datenschutz: "/privacy",
};

export default function proxy(request: NextRequest) {
  const [, locale, page, ...rest] = request.nextUrl.pathname.split("/");
  if (isLocale(locale) && !LEGAL_LANGUAGES.includes(locale) && page in LEGAL_PAGES && rest.length === 0) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${LEGAL_PAGES[page]}`;
    return NextResponse.redirect(url);
  }
  const response = intl(request);
  // The middleware sets no other cookies, so this only drops the language cookie.
  response.headers.delete("set-cookie");
  return response;
}

export const config = {
  // Every page, but not the API, Next's own files or files with an extension
  // (CVs, images, the sitemap, ...).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
