// The site's shared motion timings for JavaScript animations (Motion, canvas).
// These mirror the CSS variables in src/app/globals.css (--dur-quick,
// --dur-standard, --dur-slow, --ease-out); change both together.

export const DURATION = {
  quick: 0.2, // seconds
  standard: 0.45,
  slow: 0.8,
} as const;

/** Soft ease-out: fast start, long gentle settle. Same curve as --ease-out. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
