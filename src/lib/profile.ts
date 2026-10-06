// Typed access to src/data/profile.json.
// The JSON is the single source of truth for everything about me; components
// import `profile` from here instead of reading the JSON directly, so the
// TypeScript types below catch typos at build time.

import data from "@/data/profile.json";

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
  school: string;
  start: string;
  end: string; // "YYYY-MM" or "TODO"
  note?: string;
};

export type Certification = { name: string; detail: string };
export type Language = { name: string; level: string };
export type Skill = {
  name: string;
  size: 1 | 2 | 3;
  /** Devicon logo names, e.g. ["java-plain"]. Left out when no logo exists. */
  logos?: string[];
};

export type Profile = {
  name: string;
  shortName: string;
  location: string;
  intro: { headline: [string, string]; pitch: string };
  about: { lead: string; body: string; image: string; imageAlt: string };
  cv: { path: string; downloadName: string };
  previewImage: string;
  /** When true, the footer shows a quiet "Site stats" link to /stats. */
  showStatsLink: boolean;
  links: Link[];
  companies: Company[];
  experience: Job[];
  education: Education[];
  certifications: Certification[];
  languages: Language[];
  skills: Skill[];
};

// `as Profile` tells TypeScript to trust the JSON shape; the type above
// documents what the JSON must contain.
export const profile = data as Profile;

/** Links that are switched on ("show": true) in profile.json. */
export const visibleLinks = profile.links.filter((link) => link.show);

export function findLink(id: string): Link | undefined {
  return visibleLinks.find((link) => link.id === id);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2024-12" -> "Dec 2024". Anything else (for example "TODO") is shown as is. */
export function formatMonth(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
}

/** "Dec 2024 to present", "Jul 2018 to Jul 2022", "Apr 2024 to TODO". */
export function formatRange(start: string, end: string | null): string {
  return `${formatMonth(start)} to ${end === null ? "present" : formatMonth(end)}`;
}
