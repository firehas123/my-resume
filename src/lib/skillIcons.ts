// Technology logos for the skills cloud, from the Devicon icon set
// (https://devicon.dev, MIT licence), installed through npm as "devicon".
// Which logo belongs to which skill is set in src/data/profile.json
// ("logos": ["java-plain"]); a skill without logos stays text only.
//
// The SVG files are served by src/app/skill-icons/[icon]/route.ts, which
// is generated at build time. This file runs on the server / at build time.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { profile } from "@/lib/profile";

type DeviconEntry = { name: string; color: string };

const ICON_DIR = join(process.cwd(), "node_modules", "devicon", "icons");
// Logo names look like "java-plain" or "amazonwebservices-plain-wordmark":
// the part before the first "-" is the folder in the Devicon package.
const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Pill backgrounds in each theme (see --pill-bg in globals.css).
const PILL_BG = { dark: "#17171b", light: "#ffffff" } as const;
// WCAG 1.4.11: graphics need at least 3:1 contrast against their background.
const MIN_CONTRAST = 3;

let deviconColors: Map<string, string> | null = null;

function brandColorOf(folder: string): string | null {
  if (!deviconColors) {
    const entries: DeviconEntry[] = JSON.parse(
      readFileSync(join(process.cwd(), "node_modules", "devicon", "devicon.json"), "utf8"),
    );
    deviconColors = new Map(entries.map((e) => [e.name, e.color]));
  }
  return deviconColors.get(folder) ?? null;
}

/** Relative luminance of a "#rgb" or "#rrggbb" colour (WCAG formula). */
function luminance(hex: string): number {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function isValidIconName(name: string): boolean {
  return NAME_PATTERN.test(name);
}

/** The SVG file contents for one logo name, e.g. "java-plain". */
export function readIconSvg(name: string): string {
  if (!isValidIconName(name)) throw new Error(`Invalid icon name: ${name}`);
  const folder = name.split("-")[0];
  return readFileSync(join(ICON_DIR, folder, `${name}.svg`), "utf8");
}

/** Every logo name used in profile.json (each listed once). */
export function usedIconNames(): string[] {
  return [...new Set(profile.skills.flatMap((skill) => skill.logos ?? []))];
}

export type SkillIcon = {
  src: string; // URL of the SVG
  aspect: number; // width / height, so wide logos (the AWS wordmark) keep their shape
  // Brand colour shown on hover, per theme; null when it would be too faint
  // on that theme's pill (e.g. black Kafka on a dark pill), in which case
  // the logo keeps the text colour.
  brandDark: string | null;
  brandLight: string | null;
};

export function skillIcon(name: string): SkillIcon {
  const svg = readIconSvg(name);
  const viewBox = /viewBox="([\d.\s-]+)"/.exec(svg)?.[1].trim().split(/\s+/).map(Number);
  const aspect = viewBox && viewBox[3] > 0 ? viewBox[2] / viewBox[3] : 1;
  const brand = brandColorOf(name.split("-")[0]);
  const usable = (bg: string) => (brand && contrast(brand, bg) >= MIN_CONTRAST ? brand : null);
  return {
    src: `/skill-icons/${name}.svg`,
    aspect: Math.round(aspect * 1000) / 1000,
    brandDark: usable(PILL_BG.dark),
    brandLight: usable(PILL_BG.light),
  };
}
