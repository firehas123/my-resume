// Share images (1200x630) for link previews, rendered at build time: the MHC
// logo and a title on black, over a field of fine dots brighter toward the
// right with a few accent dots. Used by src/app/[locale]/opengraph-image.tsx
// (the site) and src/app/[locale]/projects/[slug]/opengraph-image.tsx (each
// project), once per language.
//
// Right-to-left languages are laid out right to left. The image renderer
// (satori) shapes Arabic letters correctly but does not order words for
// right-to-left text, so rtlWords() (scripts/lib/rtl.mjs) places the words.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { languageInfo, type Locale } from "@/i18n/config";
import { rtlWords } from "../../scripts/lib/rtl.mjs";

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 };

const fontDir = join(process.cwd(), "node_modules", "@fontsource");
const ACCENT = "#5BE3A8"; // --accent-bright
const TEXT = "#F4F4F5";
const MUTED = "#A1A1AA";
const { width, height } = SHARE_IMAGE_SIZE;

/** The dot field: a regular grid, brighter toward the right, a few accent dots. */
function dots() {
  const out: { x: number; y: number; r: number; color: string; opacity: number }[] = [];
  const gap = 30;
  for (let y = gap / 2; y < height; y += gap) {
    for (let x = gap / 2; x < width; x += gap) {
      const t = x / width; // 0 on the left, 1 on the right
      // A deterministic sprinkle of accent dots on the right half.
      // (A hash of the position, so they scatter instead of forming stripes.)
      const h = Math.imul(x * 73856093 ^ y * 19349663, 2654435761) >>> 0;
      const accent = t > 0.55 && h % 100 < 5;
      out.push({ x, y, r: accent ? 2.6 : 1.4 + t * 1.2, color: accent ? ACCENT : TEXT, opacity: accent ? 0.95 : 0.06 + t * 0.32 });
    }
  }
  return out;
}

/** Fonts per script after Manrope (same as the CV; see src/i18n/languages.json). */
const SCRIPT_FONT_FILES: Record<string, (weight: number) => string> = {
  arabic: (weight) => join(fontDir, "cairo", "files", `cairo-arabic-${weight}-normal.woff`),
};

/** One line of text, laid out in the direction of the language. */
function TextLine({ text, rtl, style }: { text: string; rtl: boolean; style: React.CSSProperties }) {
  if (!rtl) return <div style={{ display: "flex", ...style }}>{text}</div>;
  return (
    <div style={{ display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", columnGap: "0.26em", ...style }}>
      {rtlWords(text).map((word, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "row-reverse" }}>
          {word.flatMap((run, j) => [
            <span key={`t${j}`}>{run.text}</span>,
            // In right-to-left text the punctuation sits to the left of its word.
            run.punctuation ? <span key={`p${j}`}>{run.punctuation}</span> : null,
          ])}
        </div>
      ))}
    </div>
  );
}

type ShareImage = {
  /** Small line above the title, e.g. the name or "Project · Java". */
  eyebrow: string;
  /** Title lines; the last one is drawn in the accent colour when there are two. */
  lines: string[];
  /** Smaller title for long project names. */
  compact?: boolean;
  /** The language of the page the image belongs to. */
  locale: Locale;
};

export async function renderShareImage({ eyebrow, lines, compact, locale }: ShareImage) {
  const { dir, script } = languageInfo(locale);
  const rtl = dir === "rtl";
  const manrope = (subset: string, weight: number) => join(fontDir, "manrope", "files", `manrope-${subset}-${weight}-normal.woff`);
  const scriptFont = SCRIPT_FONT_FILES[script];
  // Manrope (Latin and Latin Extended, e.g. Turkish), then the script's own font.
  const files: { name: string; path: string; weight: 500 | 800 }[] = [
    { name: "Manrope", path: manrope("latin", 500), weight: 500 },
    { name: "Manrope", path: manrope("latin", 800), weight: 800 },
    { name: "ManropeExt", path: manrope("latin-ext", 500), weight: 500 },
    { name: "ManropeExt", path: manrope("latin-ext", 800), weight: 800 },
    ...(scriptFont
      ? [
          { name: "Script", path: scriptFont(500), weight: 500 as const },
          { name: "Script", path: scriptFont(800), weight: 800 as const },
        ]
      : []),
  ];
  const fonts = await Promise.all(files.map(async (f) => ({ name: f.name, data: await readFile(f.path), weight: f.weight, style: "normal" as const })));
  const titleSize = compact ? 72 : 96;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#000000", fontFamily: "Manrope, ManropeExt, Script" }}>
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          {dots().map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.color} fillOpacity={d.opacity} />
          ))}
        </svg>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            // Right-to-left: logo and text on the right.
            alignItems: rtl ? "flex-end" : "flex-start",
            padding: "72px 80px",
            width: "100%",
            height: "100%",
          }}
        >
          {/* The MHC logo artwork, unchanged */}
          <svg width={118} height={50} viewBox="0 0 236 100" fill="none" stroke={TEXT} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 90V10l30 50 30-50v80" />
            <path d="M70 50h50M120 10v80" />
            <path d="M214.3 21.7a40 40 0 1 0 0 56.6" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", alignItems: rtl ? "flex-end" : "flex-start", maxWidth: 1040 }}>
            <TextLine text={eyebrow} rtl={rtl} style={{ fontSize: 30, fontWeight: 500, color: MUTED, marginBottom: 20 }} />
            {lines.map((line, i) => (
              <TextLine
                key={i}
                text={line}
                rtl={rtl}
                style={{
                  fontSize: titleSize,
                  fontWeight: 800,
                  color: lines.length > 1 && i === lines.length - 1 ? ACCENT : TEXT,
                  // Tight tracking suits Manrope; joined scripts keep their natural spacing.
                  letterSpacing: rtl ? 0 : compact ? -3 : -4,
                  lineHeight: rtl ? 1.3 : 1.02,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...SHARE_IMAGE_SIZE,
      fonts,
    },
  );
}
