"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { applyTheme, hasSavedTheme, readTheme, type Theme } from "@/lib/theme";

// The theme lives on <html data-theme="...">, set before first paint.
// useSyncExternalStore lets React read that attribute and re-render when it
// changes, without keeping a second copy of the theme in React state.

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

// On the server we cannot know the visitor's theme; "dark" is the default look.
const getServerSnapshot = (): Theme => "dark";

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, getServerSnapshot);

  // Until the visitor uses the switch, keep following the system setting live.
  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const onSystemChange = () => {
      if (!hasSavedTheme()) applyTheme(query.matches ? "light" : "dark", false);
    };
    query.addEventListener("change", onSystemChange);
    return () => query.removeEventListener("change", onSystemChange);
  }, []);

  /** Switches theme; `origin` is where the new theme spreads from. */
  const toggle = useCallback((origin?: { x: number; y: number }) => {
    applyTheme(readTheme() === "dark" ? "light" : "dark", true, origin);
  }, []);

  return { theme, toggle };
}
