// Share images (1200x630) for link previews, rendered at build time: the MHC
// logo and a title on black, over a field of fine dots brighter toward the
// right with a few accent dots. Used by src/app/opengraph-image.tsx (the site)
// and src/app/projects/[slug]/opengraph-image.tsx (each project).

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const SHARE_IMAGE_SIZE = { width: 1200, height: 630 };

const fontDir = join(process.cwd(), "node_modules", "@fontsource", "manrope", "files");
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

type ShareImage = {
  /** Small line above the title, e.g. the name or "Project · Java". */
  eyebrow: string;
  /** Title lines; the last one is drawn in the accent colour when there are two. */
  lines: string[];
  /** Smaller title for long project names. */
  compact?: boolean;
};

export async function renderShareImage({ eyebrow, lines, compact }: ShareImage) {
  const [medium, extraBold] = await Promise.all([
    readFile(join(fontDir, "manrope-latin-500-normal.woff")),
    readFile(join(fontDir, "manrope-latin-800-normal.woff")),
  ]);
  const titleSize = compact ? 72 : 96;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#000000", fontFamily: "Manrope" }}>
        <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
          {dots().map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.color} fillOpacity={d.opacity} />
          ))}
        </svg>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 80px", width: "100%", height: "100%" }}>
          {/* The MHC logo artwork, unchanged */}
          <svg width={118} height={50} viewBox="0 0 236 100" fill="none" stroke={TEXT} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 90V10l30 50 30-50v80" />
            <path d="M70 50h50M120 10v80" />
            <path d="M214.3 21.7a40 40 0 1 0 0 56.6" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 1000 }}>
            <div style={{ fontSize: 30, fontWeight: 500, color: MUTED, marginBottom: 20 }}>{eyebrow}</div>
            {lines.map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: titleSize,
                  fontWeight: 800,
                  color: lines.length > 1 && i === lines.length - 1 ? ACCENT : TEXT,
                  letterSpacing: compact ? -3 : -4,
                  lineHeight: 1.02,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...SHARE_IMAGE_SIZE,
      fonts: [
        { name: "Manrope", data: medium, weight: 500, style: "normal" },
        { name: "Manrope", data: extraBold, weight: 800, style: "normal" },
      ],
    },
  );
}
