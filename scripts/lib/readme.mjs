// Turns a repository README into content for the site. Pure functions only
// (no network), tested in scripts/readme.test.mjs.
//
//   summary   the first real paragraph, as plain text (card summary)
//   overview  the opening sections as clean Markdown (project page):
//             no badges, no raw HTML, no install/usage/licence boilerplate
//   image     the first meaningful image (not a badge or an icon)

/** Section headings that are boilerplate, not a description of the project. */
const SKIP_HEADING =
  /install|setup|set up|getting started|quick ?start|usage|how to (run|use|start)|running|run (it|locally|the)|build(ing)?\b|requirement|prerequisite|dependenc|licen[cs]e|contribut|author|contact|acknowledg|credit|deploy|clone|table of contents|toc\b|repository structure|project structure|folder structure|directory structure|support|faq|changelog|roadmap|screenshots?\b/i;

/** READMEs left as a project generator wrote them describe the tool, not the project. */
const TEMPLATE_README =
  /bootstrapped with \[?create react app|getting started with create react app|this is a \[?next\.js\]?(\([^)]*\))? project bootstrapped|react \+ (typescript \+ )?vite\b|this template provides a minimal setup|welcome to your (new )?(expo|vue|svelte|angular) (app|project)|generated (by|with) angular cli/i;

const BADGE_URL = /shields\.io|badgen\.net|badge|travis-ci|codecov|circleci|coveralls|forthebadge|github\.com\/[^)]*\/(workflows|actions)\/|\/actions\/workflows\/|vercel\.com\/button|netlify\.com\/img/i;
const MAX_OVERVIEW_CHARS = 2200;
const MAX_SUMMARY_CHARS = 240;

/** Removes HTML comments and raw HTML tags, keeping their text content. */
function stripHtml(md) {
  return md
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<\/?[a-z][^>]*>/gi, "");
}

/** Lines that are only badges or images. */
function isBadgeOrImageLine(line) {
  const t = line.trim();
  if (!t) return false;
  const withoutImages = t
    .replace(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .trim();
  return withoutImages === "" && /!\[/.test(t);
}

/** Splits Markdown into sections: [{ level, heading, body }] (body excludes the heading). */
function sections(md) {
  const out = [{ level: 0, heading: "", lines: [] }];
  let inCode = false;
  for (const line of md.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) inCode = !inCode;
    const h = !inCode && /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (h) out.push({ level: h[1].length, heading: h[2].trim(), lines: [] });
    else out.at(-1).lines.push(line);
  }
  return out.map((s) => ({ ...s, body: s.lines.join("\n").trim() }));
}

/** Markdown inline syntax -> plain text. */
export function plainText(md) {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/\s+/g, " ")
    .trim();
}

/** A paragraph that reads like a description: real sentences, not a list of links or metadata. */
function isRealParagraph(text) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 8) return false;
  if (!/[a-z][.!?](\s|$)/i.test(text)) return false; // at least one finished sentence
  const urlChars = (text.match(/https?:\/\/\S+/g) ?? []).join("").length;
  return urlChars / text.length < 0.3;
}

function truncateAtSentence(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return end > max * 0.5 ? cut.slice(0, end + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/** Paragraph blocks of a section body (no lists, code, tables or quotes). */
function paragraphs(body) {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block && !/^([-*+]|\d+\.)\s|^```|^\||^>/.test(block) && !isBadgeOrImageLine(block));
}

/**
 * The README as site content. `repoName` lets the top-level title (often the
 * repo name itself) be dropped.
 */
export function readmeContent(markdown) {
  if (TEMPLATE_README.test(markdown ?? "")) return { summary: "", overview: "" };
  const md = stripHtml(markdown ?? "");
  const all = sections(md);

  // Keep the preamble and descriptive sections; drop boilerplate sections and
  // everything below them in the same branch.
  const kept = [];
  let skipLevel = Infinity;
  for (const s of all) {
    if (s.level && s.level <= skipLevel) skipLevel = Infinity;
    if (skipLevel !== Infinity) continue;
    // Only sub-sections can be boilerplate; the top title never is.
    if (s.level >= 2 && SKIP_HEADING.test(s.heading)) {
      skipLevel = s.level;
      continue;
    }
    kept.push(s);
  }

  // Summary: the first real paragraph anywhere in the kept content.
  let summary = "";
  for (const s of kept) {
    for (const p of paragraphs(s.body)) {
      const text = plainText(p);
      if (isRealParagraph(text)) {
        summary = truncateAtSentence(text, MAX_SUMMARY_CHARS);
        break;
      }
    }
    if (summary) break;
  }

  // Overview: kept sections without the first H1 (the title is shown already),
  // without badge-only lines, cut at a section boundary.
  const firstH1 = kept.findIndex((s) => s.level === 1);
  const parts = [];
  let length = 0;
  kept.forEach((s, i) => {
    const body = s.body
      .split("\n")
      .filter((line) => !isBadgeOrImageLine(line))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    if (!body && i === firstH1) return;
    const heading = i === firstH1 || !s.level ? "" : `${"#".repeat(Math.max(2, Math.min(s.level, 4)))} ${s.heading}\n\n`;
    const chunk = `${heading}${body}`.trim();
    if (!body || !chunk) return;
    if (length > 0 && length + chunk.length > MAX_OVERVIEW_CHARS) return;
    parts.push(chunk);
    length += chunk.length;
  });
  const overview = parts.join("\n\n").trim();
  // An overview with no real paragraph or list (only a title or a link) says nothing.
  const hasSubstance = Boolean(summary) || /^\s*([-*+]|\d+\.)\s+\S/m.test(overview);
  return { summary, overview: hasSubstance ? overview : "" };
}

/**
 * The first meaningful image in the README, as an absolute URL, or null.
 * Relative paths are resolved against the repo's raw files.
 */
export function readmeImage(markdown, { owner, repo, branch }) {
  const md = (markdown ?? "").replace(/<!--[\s\S]*?-->/g, "");
  const candidates = [];
  const pattern = /!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)|<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  for (const m of md.matchAll(pattern)) candidates.push(m[1] ?? m[2]);
  for (const raw of candidates) {
    if (!raw || BADGE_URL.test(raw)) continue;
    let url;
    if (/^https?:\/\//i.test(raw)) url = raw;
    else if (raw.startsWith("//")) url = `https:${raw}`;
    else if (/^(data|javascript):/i.test(raw)) continue;
    else url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${raw.replace(/^\.?\//, "")}`;
    // github.com/<o>/<r>/blob/<b>/<path> -> raw file
    url = url.replace(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/i, "https://raw.githubusercontent.com/$1/$2/$3");
    const path = url.split(/[?#]/)[0].toLowerCase();
    if (!/\.(png|jpe?g|webp|gif)$/.test(path) && !/user-images\.githubusercontent|github\.com\/user-attachments\/assets/.test(url)) continue;
    return url;
  }
  return null;
}
