"use client";

import { MotionConfig } from "motion/react";

// reducedMotion="user": when the visitor has "reduce motion" switched on,
// Motion automatically skips movement (transforms) for every animation.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
