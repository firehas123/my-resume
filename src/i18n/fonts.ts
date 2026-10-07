// Fonts per script. Manrope is the site's font for every language; scripts
// it does not cover get a matching typeface after it in the font stack.
// Next downloads all fonts at build time and serves them from this domain,
// so visitors never contact Google. The extra fonts are not preloaded: the
// browser only downloads a file when a page actually uses its letters, so
// Arabic is only fetched on Arabic pages.

import { Cairo, Manrope } from "next/font/google";
import config from "./languages.json";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

// Arabic script (ar, ur): Cairo, a geometric Arabic typeface with the same
// weights as Manrope.
const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-script",
  display: "swap",
  preload: false,
});

// To support another script, add its font here, keyed by the "site" name in
// languages.json ("scripts"), for example for Hindi:
//   import { Noto_Sans_Devanagari } from "next/font/google";
//   const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], weight: [...], variable: "--font-script", preload: false });
//   and add  devanagari  to SCRIPT_FONTS below.
const SCRIPT_FONTS: Record<string, { variable: string }> = { cairo };

const scripts = config.scripts as Record<string, { site: string | null }>;

/** Class names for <html>: Manrope everywhere, plus the font for the language's script. */
export function fontClassNames(script: string): string {
  const site = scripts[script]?.site;
  const extra = site ? SCRIPT_FONTS[site]?.variable : undefined;
  return [manrope.variable, extra].filter(Boolean).join(" ");
}
