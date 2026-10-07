// Builds the downloadable CVs, one per language, from src/data/profile.json:
// public/files/cv-<code>.pdf for every language in src/i18n/languages.json.
// The PDFs and the website always say the same thing.
//
//   npm run cv          (also runs before every `npm run build` and `npm run dev`)
//
// Uses react-pdf (no browser needed) with the site's font, Manrope, plus the
// font for the language's script (Cairo for Arabic), embedded in each PDF.
// Right-to-left languages are laid out right to left. react-pdf shapes
// Arabic letters correctly but does not order the words of right-to-left
// text, so such text is laid out word by word (see T() and scripts/lib/rtl.mjs).
//
// On purpose the PDF contains no phone number. It shows an email address
// only when "cvShowEmail" is true in profile.json, and the photo only when
// "cvShowPhoto" is true. The section titles and the few fixed words come from
// messages/<code>.json ("cvDocument").
//
// Plain React.createElement calls (aliased as `h`) because this is a .mjs
// file without JSX.

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { Document, Font, Image, Link, Page, StyleSheet, Text, View, renderToFile } from "@react-pdf/renderer";
import { localize, mergeMessages } from "./lib/i18n.mjs";
import { hasRtl, rtlWords } from "./lib/rtl.mjs";

const h = React.createElement;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), "utf8"));

const config = readJson("src/i18n/languages.json");
const rawProfile = readJson("src/data/profile.json");
const english = readJson("messages/en.json");
const codes = new Set(Object.keys(config.catalog));
const OUT_DIR = join(ROOT, "public", "files");

// The live site's address, printed in the header. On Vercel the production
// domain is known at build time; CV_SITE_URL or NEXT_PUBLIC_SITE_URL override it.
const SITE_URL = (
  process.env.CV_SITE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://my-resume-pied-tau.vercel.app")
).replace(/\/$/, "");

// Colours from globals.css (light theme): text, muted text, the one accent,
// hairline. All dark enough to print well in black and white.
const COLOR = { text: "#0a0a0c", muted: "#55555c", accent: "#0b7a54", line: "#dcdce0" };

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

const WEIGHTS = [400, 600, 700, 800];
const fontsource = (pkg, file) => join(ROOT, "node_modules", pkg, "files", file);

// Manrope in two parts: Latin, and Latin Extended (Turkish ğ, ş, ı, İ ...).
for (const weight of WEIGHTS) {
  Font.register({ family: "Manrope", src: fontsource("@fontsource/manrope", `manrope-latin-${weight}-normal.woff`), fontWeight: weight });
  Font.register({ family: "ManropeExt", src: fontsource("@fontsource/manrope", `manrope-latin-ext-${weight}-normal.woff`), fontWeight: weight });
}

/** Registers the font for a script (from "scripts" in languages.json) and returns its family name, or null. */
const scriptFamilies = new Map();
function scriptFamily(script) {
  if (scriptFamilies.has(script)) return scriptFamilies.get(script);
  const pkg = config.scripts[script]?.cv;
  let family = null;
  if (pkg) {
    const base = pkg.split("/").pop(); // "@fontsource/cairo" -> "cairo"
    const files = WEIGHTS.map((weight) => [weight, fontsource(pkg, `${base}-${script}-${weight}-normal.woff`)]);
    const missing = files.filter(([, file]) => !existsSync(file));
    if (missing.length) {
      throw new Error(`The CV needs the font package ${pkg} for ${script} (missing ${missing[0][1]}). Run: npm install -D ${pkg}`);
    }
    family = `Script-${script}`;
    for (const [weight, src] of files) Font.register({ family, src, fontWeight: weight });
  }
  scriptFamilies.set(script, family);
  return family;
}

// Keep words whole (react-pdf would otherwise hyphenate anywhere).
Font.registerHyphenationCallback((word) => [word]);

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

/** Fills "{name}"-style placeholders in a message. */
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);

function messagesFor(code) {
  const file = join(ROOT, "messages", `${code}.json`);
  return existsSync(file) ? mergeMessages(english, JSON.parse(readFileSync(file, "utf8"))) : english;
}

/** "2024-12" -> "12/2024" (numeric) or "Dec 2024" / "déc. 2024" (month names of the language). */
function formatMonth(value, entry) {
  const [year, month] = value.split("-").map(Number);
  if (entry.cvDates === "numeric") return `${String(month).padStart(2, "0")}/${year}`;
  return new Intl.DateTimeFormat(entry.intl, { month: "short", year: "numeric", timeZone: "UTC" }).format(Date.UTC(year, month - 1, 1));
}

const plainUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

// Style properties that belong to the box (spacing, borders) versus the
// letters, for right-to-left text split into word boxes (see T() below).
const BOX_KEYS = new Set(["marginTop", "marginBottom", "paddingTop", "paddingBottom", "borderTopWidth", "borderTopColor", "borderBottomWidth", "borderBottomColor", "flex", "flexShrink", "flexWrap"]);
const layoutOnly = (style) => Object.fromEntries(Object.entries(style ?? {}).filter(([key]) => BOX_KEYS.has(key)));
const textOnly = (styles) => Object.fromEntries(styles.flatMap((style) => Object.entries(style ?? {})).filter(([key]) => !BOX_KEYS.has(key)));

// ---------------------------------------------------------------------------
// One CV
// ---------------------------------------------------------------------------

function buildCv(code) {
  const entry = config.catalog[code];
  const rtl = entry.dir === "rtl";
  const primary = config.primary.includes(code);
  const profile = localize(rawProfile, code, codes);
  const m = messagesFor(code);
  const words = m.cvDocument;
  const family = ["Manrope", "ManropeExt", scriptFamily(entry.script)].filter(Boolean);
  const joined = entry.letters === false; // joined scripts: no letter spacing, no capitals

  const month = (value) => (!value || value === "present" ? m.dates.present : formatMonth(value, entry));
  const range = (start, end) => fill(words.range, { start: month(start), end: month(end) });
  // Mirrors a row for right-to-left languages.
  const row = rtl ? "row-reverse" : "row";
  const align = rtl ? "right" : "left";

  const s = StyleSheet.create({
    page: { fontFamily: family, fontSize: 8.7, lineHeight: joined ? 1.55 : 1.4, color: COLOR.text, paddingVertical: 28, paddingHorizontal: 42, textAlign: align },
    docHeading: { fontSize: 7.5, fontWeight: 700, letterSpacing: joined ? 0 : 1.4, textTransform: joined ? "none" : "uppercase", color: COLOR.muted, marginBottom: 4 },
    headerRow: { flexDirection: row, justifyContent: "space-between", alignItems: "flex-start" },
    name: { fontSize: 22, lineHeight: 1.15, fontWeight: 800, letterSpacing: joined ? 0 : -0.4 },
    tagline: { fontSize: 10.5, fontWeight: 600, color: COLOR.accent, marginTop: 2 },
    contact: { flexDirection: row, flexWrap: "wrap", marginTop: 6, color: COLOR.muted, fontSize: 8.5 },
    separator: { color: COLOR.line, marginHorizontal: 6 },
    link: { color: COLOR.muted, textDecoration: "none" },
    photo: { width: 64, height: 64, borderRadius: 32, objectFit: "cover" },
    translated: { marginTop: 8, paddingTop: 5, borderTopWidth: 1, borderTopColor: COLOR.line, fontSize: 8, color: COLOR.muted },
    section: { marginTop: 11 },
    heading: {
      fontSize: 8,
      fontWeight: 800,
      letterSpacing: joined ? 0 : 1.2,
      textTransform: joined ? "none" : "uppercase",
      color: COLOR.accent,
      paddingBottom: 3,
      marginBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: COLOR.line,
    },
    entry: { marginBottom: 6 },
    row: { flexDirection: row, justifyContent: "space-between", alignItems: "baseline" },
    rowMain: { flex: 1, paddingRight: rtl ? 0 : 10, paddingLeft: rtl ? 10 : 0 },
    title: { fontSize: 10.5, fontWeight: 700 },
    // The dates keep their width; the title beside them wraps instead.
    // Dates never wrap: "12/2023 – 04/2024" stays on one line in every language.
    meta: { color: COLOR.muted, fontWeight: 600, flexShrink: 0, flexWrap: "nowrap" },
    sub: { fontWeight: 600, color: COLOR.muted, marginTop: 1 },
    bullets: { marginTop: 3 },
    bullet: { flexDirection: row, marginBottom: 1 },
    dot: { width: 10, color: COLOR.accent, textAlign: align },
    bulletText: { flex: 1 },
    columns: { flexDirection: row, gap: 24 },
    column: { flex: 1 },
    item: { marginBottom: 3 },
    strong: { fontWeight: 700 },
    muted: { color: COLOR.muted },
  });

  const linkedin = profile.links.find((l) => l.id === "linkedin" && l.show);
  const github = profile.links.find((l) => l.id === "github" && l.show);
  const siteForLanguage = `${SITE_URL}/${code}`;

  /**
   * A text. Right-to-left text becomes a row of words placed from the right,
   * wrapping like a paragraph; everything else is a normal <Text>.
   */
  function T(style, text, props = {}) {
    if (!rtl || !hasRtl(text)) return h(Text, { ...props, style }, text);
    const flat = [].concat(style ?? []);
    return h(
      View,
      { ...props, style: { flexDirection: "row-reverse", flexWrap: "wrap", columnGap: 2.6, ...Object.assign({}, ...flat.map(layoutOnly)) } },
      ...rtlWords(text).map((word, i) =>
        h(
          View,
          { key: i, style: { flexDirection: "row-reverse" } },
          ...word.flatMap((run, j) => [
            h(Text, { key: `t${j}`, style: textOnly(flat) }, run.text),
            // In right-to-left text the punctuation sits to the left of its word.
            run.punctuation ? h(Text, { key: `p${j}`, style: textOnly(flat) }, run.punctuation) : null,
          ]),
        ),
      ),
    );
  }

  function Section(title, ...children) {
    // minPresenceAhead: a heading never sits alone at the bottom of a page.
    return h(View, { style: s.section }, T(s.heading, title, { minPresenceAhead: 40 }), ...children);
  }

  function Bullets(items) {
    return h(
      View,
      { style: s.bullets },
      ...items.map((text, i) =>
        h(View, { key: i, style: s.bullet, wrap: false }, h(Text, { style: s.dot }, "•"), h(View, { style: s.bulletText }, T(null, text))),
      ),
    );
  }

  // Header: "Lebenslauf" / "Curriculum Vitae", name, title, contact line.
  // Addresses and the email stay left to right inside right-to-left text.
  const contactParts = [
    T(null, profile.city, { key: "city" }),
    linkedin && h(Link, { key: "li", style: s.link, src: linkedin.url }, plainUrl(linkedin.url)),
    github && h(Link, { key: "gh", style: s.link, src: github.url }, plainUrl(github.url)),
    h(Link, { key: "site", style: s.link, src: siteForLanguage }, plainUrl(siteForLanguage)),
    profile.cvShowEmail && profile.cvEmail && h(Link, { key: "mail", style: s.link, src: `mailto:${profile.cvEmail}` }, profile.cvEmail),
  ].filter(Boolean);
  const contact = contactParts.flatMap((part, i) => (i === 0 ? [part] : [h(Text, { key: `sep-${i}`, style: s.separator }, "|"), part]));

  const photoFile = profile.cvShowPhoto && profile.cvPhoto ? join(ROOT, "public", profile.cvPhoto) : null;
  const header = h(
    View,
    null,
    h(
      View,
      { style: s.headerRow },
      h(
        View,
        { style: { flex: 1 } },
        T(s.docHeading, words.heading),
        T(s.name, profile.name),
        T(s.tagline, profile.title),
        h(View, { style: s.contact }, ...contact),
      ),
      photoFile && existsSync(photoFile) ? h(Image, { style: s.photo, src: photoFile }) : null,
    ),
    // Honesty line on CVs that are not in one of my working languages.
    !primary &&
      T(
        s.translated,
        fill(words.translated, {
          languages: new Intl.ListFormat(entry.intl, { type: "conjunction" }).format(
            profile.languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)),
          ),
        }),
      ),
  );

  const profileSection = Section(words.profile, T(null, profile.cvProfile));

  const experience = Section(
    words.experience,
    ...profile.experience.map((job, i) =>
      h(
        View,
        { key: i, style: s.entry },
        // Keep a job's heading with its first lines (no orphaned headings).
        h(
          View,
          { wrap: false },
          h(
            View,
            { style: s.row },
            h(View, { style: s.rowMain }, T(s.title, fill(words.roleAt, { role: job.role, company: job.legalName ?? job.company }))),
            T(s.meta, range(job.start, job.end)),
          ),
          T(s.sub, fill(words.place, { city: job.city, country: job.country })),
        ),
        Bullets(job.highlights),
      ),
    ),
  );

  const education = Section(
    words.education,
    ...profile.education.map((item, i) =>
      h(
        View,
        { key: i, style: s.entry, wrap: false },
        h(View, { style: s.row }, h(View, { style: s.rowMain }, T(s.title, item.degree)), T(s.meta, range(item.start, item.end))),
        T(s.sub, [item.school, item.note].filter(Boolean).join(" · ")),
      ),
    ),
  );

  // A no-break space keeps each "·" with the word before it when lines wrap.
  const skills = Section(words.skills, T(null, profile.skills.map((skill) => skill.name).join("\u00a0· ")));

  const certifications = Section(
    words.certifications,
    ...profile.certifications.map((c, i) =>
      h(View, { key: i, style: s.item, wrap: false }, T(s.strong, c.name), T(s.muted, c.detail)),
    ),
  );

  // One line: "English C1 · German A2" (pieces placed in the reading direction).
  const languages = Section(
    words.languages,
    h(
      View,
      { style: { flexDirection: row, flexWrap: "wrap", columnGap: 8 } },
      ...profile.languages.map((l, i) =>
        h(View, { key: i, style: { flexDirection: row, columnGap: 4 } }, T(s.strong, l.name), l.level ? T(s.muted, l.level) : null),
      ),
    ),
  );

  // Below the experience: two columns (mirrored in right-to-left languages).
  const lower = h(
    View,
    { style: s.columns },
    h(View, { style: [s.column, { flex: 1.4 }] }, education, skills, languages),
    h(View, { style: s.column }, certifications),
  );

  return h(
    Document,
    {
      title: `${profile.name}, ${words.heading}`,
      author: profile.name,
      subject: words.heading,
      language: code,
      creator: "scripts/build-cv.mjs",
      producer: "react-pdf",
    },
    h(Page, { size: "A4", style: s.page }, header, profileSection, experience, lower),
  );
}

// ---------------------------------------------------------------------------
// Build every language, and remove CVs of languages no longer configured.
// ---------------------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true });
for (const file of readdirSync(OUT_DIR)) {
  const match = /^cv-([a-z]{2,3})\.pdf$/.exec(file);
  if (match && !config.languages.includes(match[1])) rmSync(join(OUT_DIR, file));
}

for (const code of config.languages) {
  const output = join(OUT_DIR, `cv-${code}.pdf`);
  await renderToFile(buildCv(code), output);
  // A rough page count: one "/Type /Page" object per page.
  const pages = (readFileSync(output, "latin1").match(/\/Type \/Page\b/g) ?? []).length;
  const note = pages > 2 ? `  WARNING: ${pages} pages; the CV should fit on one or two` : "";
  console.log(`CV written to public/files/cv-${code}.pdf (${pages} page${pages === 1 ? "" : "s"})${note}`);
}
