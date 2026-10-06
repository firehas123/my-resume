"use client";

import { useSyncExternalStore } from "react";

/** Live result of a CSS media query (false on the server). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * Desktop with a real cursor and motion allowed. Parallax, tilt, magnetic
 * buttons and cursor effects only run when this is true; phones keep the
 * reveals and page transitions only.
 */
export const RICH_MOTION_QUERY =
  "(hover: hover) and (pointer: fine) and (min-width: 900px) and (prefers-reduced-motion: no-preference)";

export function useRichMotion(): boolean {
  return useMediaQuery(RICH_MOTION_QUERY);
}
