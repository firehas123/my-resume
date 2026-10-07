// Builds the downloadable CV (public/files/resume.pdf) from src/data/profile.json,
// so the PDF and the website always say the same thing.
//
//   npm run cv
//
// Uses react-pdf (no browser needed) and the site's font, Manrope. On purpose
// the PDF contains no phone number and no email address: the site is public,
// and the contact form, LinkedIn and GitHub are the ways to get in touch.
// Plain React.createElement calls (aliased as `h`) because this is a .mjs
// file without JSX.

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { Document, Font, Link, Page, StyleSheet, Text, View, renderToFile } from "@react-pdf/renderer";

const h = React.createElement;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const profile = JSON.parse(readFileSync(join(ROOT, "src/data/profile.json"), "utf8"));
const OUTPUT = join(ROOT, "public", profile.cv.path);
// The live site; the CV links to its contact page.
const SITE_URL = (process.env.CV_SITE_URL ?? "https://my-resume-pied-tau.vercel.app").replace(/\/$/, "");

// Colours from globals.css (light theme): text, muted text, accent, hairline.
const COLOR = { text: "#0a0a0c", muted: "#55555c", accent: "#0b7a54", line: "#dcdce0" };

for (const weight of [400, 600, 700, 800]) {
  Font.register({
    family: "Manrope",
    src: require.resolve(`@fontsource/manrope/files/manrope-latin-${weight}-normal.woff`),
    fontWeight: weight,
  });
}
// Keep words whole (react-pdf would otherwise hyphenate anywhere).
Font.registerHyphenationCallback((word) => [word]);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2024-12" → "Dec 2024"; null or "present" → "present". */
function month(value) {
  if (!value || value === "present") return "present";
  const [year, m] = value.split("-");
  return `${MONTHS[Number(m) - 1]} ${year}`;
}
const range = (start, end) => `${month(start)} – ${month(end)}`;

const s = StyleSheet.create({
  page: { fontFamily: "Manrope", fontSize: 9, lineHeight: 1.45, color: COLOR.text, paddingVertical: 34, paddingHorizontal: 44 },
  name: { fontSize: 22, lineHeight: 1.15, fontWeight: 800, letterSpacing: -0.4 },
  tagline: { fontSize: 10.5, fontWeight: 600, color: COLOR.accent, marginTop: 2 },
  contact: { flexDirection: "row", flexWrap: "wrap", marginTop: 6, color: COLOR.muted, fontSize: 8.5 },
  separator: { color: COLOR.line, marginHorizontal: 6 },
  link: { color: COLOR.muted, textDecoration: "none" },
  section: { marginTop: 13 },
  heading: {
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: COLOR.accent,
    paddingBottom: 3,
    marginBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: COLOR.line,
  },
  entry: { marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  title: { fontSize: 10.5, fontWeight: 700 },
  meta: { color: COLOR.muted, fontWeight: 600 },
  sub: { fontWeight: 600, color: COLOR.muted, marginTop: 1 },
  bullets: { marginTop: 3 },
  bullet: { flexDirection: "row", marginBottom: 1 },
  dot: { width: 10, color: COLOR.accent },
  bulletText: { flex: 1 },
  columns: { flexDirection: "row", gap: 24 },
  column: { flex: 1 },
  item: { marginBottom: 2 },
  strong: { fontWeight: 700 },
  muted: { color: COLOR.muted },
});

const separator = () => h(Text, { style: s.separator }, "|");
const linkedin = profile.links.find((l) => l.id === "linkedin");
const github = profile.links.find((l) => l.id === "github");
const plain = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

function Section(title, ...children) {
  return h(View, { style: s.section }, h(Text, { style: s.heading }, title), ...children);
}

function Bullets(items) {
  return h(
    View,
    { style: s.bullets },
    ...items.map((text, i) =>
      h(View, { key: i, style: s.bullet, wrap: false }, h(Text, { style: s.dot }, "•"), h(Text, { style: s.bulletText }, text)),
    ),
  );
}

const header = h(
  View,
  null,
  h(Text, { style: s.name }, profile.name),
  h(Text, { style: s.tagline }, "Software Engineer · Master's student in Artificial Intelligence"),
  h(
    View,
    { style: s.contact },
    h(Text, null, profile.location),
    separator(),
    h(Link, { style: s.link, src: `${SITE_URL}/contact` }, `Contact: ${plain(SITE_URL)}/contact`),
    linkedin && separator(),
    linkedin && h(Link, { style: s.link, src: linkedin.url }, "LinkedIn"),
    github && separator(),
    github && h(Link, { style: s.link, src: github.url }, "GitHub"),
  ),
);

const experience = Section(
  "Experience",
  ...profile.experience.map((job, i) =>
    h(
      View,
      { key: i, style: s.entry },
      // Keep a job's heading with its first lines (no orphaned headings).
      h(
        View,
        { wrap: false },
        h(View, { style: s.row }, h(Text, { style: s.title }, `${job.role}, ${job.legalName ?? job.company}`), h(Text, { style: s.meta }, range(job.start, job.end))),
        h(Text, { style: s.sub }, `${job.city}, ${job.country}`),
      ),
      Bullets(job.highlights),
    ),
  ),
);

const education = Section(
  "Education",
  ...profile.education.map((item, i) =>
    h(
      View,
      { key: i, style: s.entry, wrap: false },
      h(View, { style: s.row }, h(Text, { style: s.title }, item.degree), h(Text, { style: s.meta }, range(item.start, item.end))),
      h(Text, { style: s.sub }, [item.school, item.note].filter(Boolean).join(" · ")),
    ),
  ),
);

// A no-break space keeps each "·" with the word before it when lines wrap.
const skills = Section("Skills", h(Text, null, profile.skills.map((skill) => skill.name).join("\u00a0· ")));

const certifications = Section(
  "Certifications",
  ...profile.certifications.map((c, i) =>
    h(View, { key: i, style: s.item }, h(Text, { style: s.strong }, c.name), h(Text, { style: s.muted }, c.detail)),
  ),
);

const languages = Section(
  "Languages",
  ...profile.languages.map((l, i) =>
    h(Text, { key: i, style: s.item }, h(Text, { style: s.strong }, l.name), l.level ? h(Text, { style: s.muted }, `  ${l.level}`) : null),
  ),
);

// Below the experience: two columns, so everything fits on one page.
const lower = h(
  View,
  { style: s.columns },
  h(View, { style: [s.column, { flex: 1.4 }] }, education, skills),
  h(View, { style: s.column }, certifications, languages),
);

const doc = h(
  Document,
  { title: `${profile.name}, CV`, author: profile.name, subject: "Curriculum vitae", creator: "scripts/build-cv.mjs", producer: "react-pdf" },
  h(Page, { size: "A4", style: s.page }, header, experience, lower),
);

await renderToFile(doc, OUTPUT);
console.log(`CV written to ${OUTPUT.replace(ROOT + "/", "")}`);
