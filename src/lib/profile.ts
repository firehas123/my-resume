// Typed access to src/data/profile.json.
// The JSON is the single source of truth for everything about me; components
// get it through getProfile(), already in the language of the current page,
// so they never deal with translations themselves. The TypeScript types
// below describe the result and catch typos at build time.

import { getLocale } from "next-intl/server";
import data from "@/data/profile.json";
import { CATALOG_CODES, type Locale } from "@/i18n/config";
import { localize } from "../../scripts/lib/i18n.mjs";

export type Link = { id: string; label: string; url: string; show: boolean };
export type Company = {
  name: string;
  logo: string; // file name in public/logos/ without extension
  /**
   * How much of the logo file's height its letters fill (measured: Zertificon
   * 0.395 because its tagline sits below, INFOTECH 0.97 in capitals). The strip
   * sizes each logo so the letters come out the same height. i2c is a compact
   * emblem, sized to match the tall letters of the others (0.7).
   */
  letterRatio: number;
};

export type Job = {
  company: string;
  legalName?: string;
  role: string;
  city: string;
  country: string;
  start: string; // "YYYY-MM"
  end: string | null; // null means "present"
  summary: string;
  highlights: string[];
};

export type Education = {
  degree: string;
  /** Short form for the hero status line, e.g. "M.Sc. AI at FAU". */
  short?: string;
  school: string;
  start: string;
  end: string; // "YYYY-MM", or "present" while still studying
  note?: string;
};

export type Certification = { name: string; detail: string };
export type Language = { name: string; level?: string };
export type Skill = {
  name: string;
  size: 1 | 2 | 3;
  /** Devicon logo names, e.g. ["java-plain"]. Left out when no logo exists. */
  logos?: string[];
};

/** The profile in one language: every text is a plain string here. */
export type Profile = {
  name: string;
  shortName: string;
  /** Job title for the CV header, e.g. "Software Engineer". */
  title: string;
  city: string;
  location: string;
  intro: { headline: [string, string]; pitch: string };
  /** statements: short lines shown one per line; the last one is in the accent colour. */
  about: { headline: string; statements: string[]; image: string; imageAlt: string };
  /** The Profile paragraph at the top of the CV. */
  cvProfile: string;
  cvShowEmail: boolean;
  cvEmail: string;
  cvShowPhoto: boolean;
  cvPhoto: string;
  /** When true, the footer shows a quiet "Site stats" link to /stats. */
  showStatsLink: boolean;
  /**
   * Web3Forms access key for the contact form. Public by design (it only
   * lets people send messages to the owner's inbox). NEXT_PUBLIC_WEB3FORMS_KEY
   * overrides it.
   */
  contactAccessKey: string;
  /** Postal address for the Legal Notice and Privacy Policy only; shown nowhere else. */
  postalAddress: { street: string; postcode: string; city: string; country: string };
  links: Link[];
  companies: Company[];
  experience: Job[];
  education: Education[];
  certifications: Certification[];
  languages: Language[];
  skills: Skill[];
};

const cache = new Map<Locale, Profile>();

/** The profile with every text in `locale` (English where a text has no translation). */
export function profileFor(locale: Locale): Profile {
  let profile = cache.get(locale);
  if (!profile) {
    // `as Profile`: localize() turns every { "en": ..., "de": ... } into one string.
    profile = localize(data, locale, CATALOG_CODES) as Profile;
    cache.set(locale, profile);
  }
  return profile;
}

/** The profile in the language of the page being rendered (server components). */
export async function getProfile(): Promise<Profile> {
  return profileFor(await getLocale());
}

/** Links that are switched on ("show": true) in profile.json. */
export const visibleLinks: Link[] = (data.links as Link[]).filter((link) => link.show);

export function findLink(id: string): Link | undefined {
  return visibleLinks.find((link) => link.id === id);
}
