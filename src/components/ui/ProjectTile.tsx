// An abstract preview tile for projects without an image: a grid of dots
// and a few connecting lines, generated from the repo name, so each project
// always gets the same tile and no card is ever blank. Colours come from the
// theme (CSS variables), so it fits both themes. No stock art.

import styles from "./ProjectTile.module.css";

/** FNV-1a: a small, stable hash of the name. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: a tiny seeded random number generator (same seed, same numbers). */
function random(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COLS = 16;
const ROWS = 9;
const GAP = 20;
const WIDTH = COLS * GAP;
const HEIGHT = ROWS * GAP;

export function ProjectTile({ name, className }: { name: string; className?: string }) {
  const rand = random(hash(name));
  // A soft "hot spot" somewhere on the grid makes dots nearby bigger.
  const hx = 3 + rand() * (COLS - 6);
  const hy = 2 + rand() * (ROWS - 4);
  const dots: { x: number; y: number; r: number; accent: boolean }[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const d = Math.hypot(col - hx, row - hy);
      const r = Math.max(0.8, 3.2 - d * 0.35 + rand() * 0.6);
      dots.push({ x: col * GAP + GAP / 2, y: row * GAP + GAP / 2, r, accent: d < 2.6 && rand() > 0.45 });
    }
  }
  // Three lines joining accent dots near the hot spot.
  const anchors = dots.filter((p) => p.accent);
  const lines = anchors.slice(0, 4).map((p, i, list) => ({ from: p, to: list[(i + 1) % list.length] }));

  return (
    <svg className={`${styles.tile} ${className ?? ""}`} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {lines.map((l, i) => (
        <line key={i} x1={l.from.x} y1={l.from.y} x2={l.to.x} y2={l.to.y} className={styles.line} />
      ))}
      {dots.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} className={p.accent ? styles.accent : styles.dot} />
      ))}
    </svg>
  );
}
