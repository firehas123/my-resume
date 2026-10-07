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

export type Profile = {
  name: string;
  shortName: string;
  location: string;
  intro: { headline: [string, string]; pitch: string };
  /** statements: short lines shown one per line; the last one is in the accent colour. */
  about: { headline: string; statements: string[]; image: string; imageAlt: string };
  cv: { path: string; downloadName: string };
  /** When true, the footer shows a quiet "Site stats" link to /stats. */
  showStatsLink: boolean;
  /**
   * Web3Forms access key for the contact form. Public by design (it only
   * lets people send messages to the owner's inbox). NEXT_PUBLIC_WEB3FORMS_KEY
   * overrides it.
   */
  contactAccessKey: string;
  /** Postal address for the Impressum only; shown nowhere else on the site. */
  postalAddress: { street: string; postcode: string; city: string; country: string };
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

/** "2024-12" -> "Dec 2024". Anything else (for example "present") is shown as is. */
export function formatMonth(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;
  return `${MONTHS[Number(match[2]) - 1]} ${match[1]}`;
}

/** "Dec 2024 to present", "Jul 2018 to Jul 2022". */
export function formatRange(start: string, end: string | null): string {
  return `${formatMonth(start)} to ${end === null ? "present" : formatMonth(end)}`;
}

/**
 * Length of a job, counting both the first and the last month, the way
 * LinkedIn does: "1 yr 6 mos", "3 mos", "2 yrs". A missing end means "until
 * now" (the date the site was built).
 */
export function formatDuration(start: string, end: string | null, now = new Date()): string {
  const [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end && /^\d{4}-\d{2}$/.test(end) ? end.split("-").map(Number) : [now.getUTCFullYear(), now.getUTCMonth() + 1];
  const months = Math.max(1, ey * 12 + em - (sy * 12 + sm) + 1);
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years) parts.push(`${years} yr${years === 1 ? "" : "s"}`);
  if (rest) parts.push(`${rest} mo${rest === 1 ? "" : "s"}`);
  return parts.join(" ");
}

/**
 * "Working student at Zertificon · M.Sc. AI at FAU": the current job (no end
 * date) and current studies ("present"), built from the data above.
 */
export function statusLine(): string {
  const job = profile.experience.find((j) => j.end === null);
  const study = profile.education.find((e) => e.end === "present");
  const parts = [];
  if (job) parts.push(`${job.role[0]}${job.role.slice(1).toLowerCase()} at ${job.company}`);
  if (study) parts.push(study.short ?? study.degree);
  return parts.join(" · ");
}

