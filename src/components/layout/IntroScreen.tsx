"use client";

import { useEffect } from "react";
import { Logo } from "@/components/ui/Logo";
import styles from "./IntroScreen.module.css";

// Total length of the intro in ms (see IntroScreen.module.css). The overlay
// is only visible while <html> has data-intro, which the pre-paint script in
// src/lib/theme.ts sets on the first visit of a browser session. The whole
// animation is plain CSS, so it starts on the very first paint and finishes
// on time even if JavaScript is slow. This component only cleans up.
const INTRO_MS = 1400;
// A little extra so the hero headline (which starts as the intro lifts)
// finishes its own entrance before the flag is removed.
const CLEANUP_MS = INTRO_MS + 300;

/**
 * Tells the CSS where the header logo is, so the intro logo can travel into
 * its place. Inlined right after the header (see layout.tsx) so it runs
 * during parsing, long before React hydrates. Without these values the
 * logo simply fades out.
 */
export const INTRO_TRAVEL_SCRIPT = `(function () {
  if (!document.documentElement.hasAttribute("data-intro")) return;
  var mark = document.querySelector("[data-intro-mark]");
  var target = document.querySelector("[data-header-logo] svg");
  if (!mark || !target) return;
  var from = mark.getBoundingClientRect();
  var to = target.getBoundingClientRect();
  if (!from.height || !to.height) return;
  mark.style.setProperty("--travel-x", to.left + to.width / 2 - (from.left + from.width / 2) + "px");
  mark.style.setProperty("--travel-y", to.top + to.height / 2 - (from.top + from.height / 2) + "px");
  mark.style.setProperty("--travel-scale", String(to.height / from.height));
  mark.style.setProperty("--travel-opacity", "1");
})();`;

export function IntroScreen() {
  useEffect(() => {
    const root = document.documentElement;
    if (!root.hasAttribute("data-intro")) return;
    const timer = window.setTimeout(() => root.removeAttribute("data-intro"), CLEANUP_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // aria-hidden: the intro is decoration. The real page is already rendered
  // underneath, for screen readers and search engines alike.
  return (
    <div className={styles.intro} aria-hidden="true">
      <div className={styles.backdrop} />
      <div className={styles.inner}>
        {/* suppressHydrationWarning: INTRO_TRAVEL_SCRIPT adds inline styles. */}
        <span className={styles.mark} data-intro-mark="" suppressHydrationWarning>
          <Logo height={64} strokeClassNames={[styles.m, styles.h, styles.c]} />
        </span>
        <span className={styles.progress} />
      </div>
    </div>
  );
}
