// The MHC monogram. This is the exact artwork from design-reference/mhc-logo.svg;
// do not redraw it. It uses `currentColor`, so it takes the surrounding text
// colour and works in both themes.

type LogoProps = {
  /** Height in px; the width follows the 236:100 artwork ratio. */
  height?: number;
  className?: string;
  /** Accessible name. Leave empty when a parent (e.g. a link) already has one. */
  title?: string;
  /** Optional class per stroke (M, H, C), used by the loading screen to draw them. */
  strokeClassNames?: [string, string, string];
};

const STROKES = [
  "M10 90V10l30 50 30-50v80", // M
  "M70 50h50M120 10v80", // H (shares its left leg with the M)
  "M214.3 21.7a40 40 0 1 0 0 56.6", // C
];

export function Logo({ height = 26, className, title, strokeClassNames }: LogoProps) {
  const width = Math.round((height * 236) / 100);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 236 100"
      width={width}
      height={height}
      fill="none"
      stroke="currentColor"
      strokeWidth={9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {STROKES.map((d, i) => (
        <path
          key={d}
          d={d}
          className={strokeClassNames?.[i]}
          // pathLength="1" lets CSS animate the drawing without measuring
          // each stroke. It does not change how the logo looks.
          pathLength={strokeClassNames ? 1 : undefined}
        />
      ))}
    </svg>
  );
}
