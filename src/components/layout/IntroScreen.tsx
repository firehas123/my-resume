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
      <div className={styles.inner}>
        <Logo height={64} strokeClassNames={[styles.m, styles.h, styles.c]} />
        <span className={styles.progress} />
      </div>
    </div>
  );
}
