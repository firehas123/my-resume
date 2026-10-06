// Theme + intro bootstrapping.
//
// PRE_PAINT_SCRIPT runs as an inline <script> in <head>, before the browser
// paints anything. That is the only way to avoid a flash of the wrong theme,
// because React has not loaded yet at that point. It:
//   1. marks <html> with the class "js" (lets CSS know JavaScript is running),
//   2. sets data-theme to the saved choice, or else to the system setting,
//   3. decides whether to play the intro (first visit in this browser session,
//      and the visitor has not asked for reduced motion).

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "theme"; // localStorage

/** Browser bar colour per theme: the header's background (--header-bg). */
export const THEME_COLORS = { dark: "#0a0a0c", light: "#ffffff" } as const;
export const INTRO_STORAGE_KEY = "intro-seen"; // sessionStorage

// Plain old JavaScript in a string: it runs before any bundling or React.
// Each storage access is in its own try/catch because private browsing
// modes can throw on localStorage/sessionStorage.
export const PRE_PAINT_SCRIPT = `(function () {
  var root = document.documentElement;
  root.classList.add("js");
  var theme = "dark";
  try {
    var saved = localStorage.getItem("${THEME_STORAGE_KEY}");
    if (saved === "light" || saved === "dark") theme = saved;
    else if (window.matchMedia("(prefers-color-scheme: light)").matches) theme = "light";
  } catch (e) {}
  root.setAttribute("data-theme", theme);
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "light" ? "${THEME_COLORS.light}" : "${THEME_COLORS.dark}");
  try {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce && !sessionStorage.getItem("${INTRO_STORAGE_KEY}")) {
      sessionStorage.setItem("${INTRO_STORAGE_KEY}", "1");
      root.setAttribute("data-intro", "play");
    }
  } catch (e) {}
})();`;

/** Reads the theme the pre-paint script (or the switch) applied. */
export function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** Sets the theme attribute and the browser bar colour, nothing else. */
function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
}

/**
 * Applies a theme and remembers the choice.
 *
 * With an `origin` (the switch's centre) and View Transitions available, the
 * new theme spreads as a circle from that point over the old one. Otherwise
 * (older browsers, reduced motion, system changes) colours cross-fade for
 * ~250ms.
 */
export function applyTheme(theme: Theme, remember: boolean, origin?: { x: number; y: number }) {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (origin && !reduce && typeof document.startViewTransition === "function") {
    // Radius that reaches the farthest corner of the viewport.
    const radius = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
    root.style.setProperty("--theme-x", `${origin.x}px`);
    root.style.setProperty("--theme-y", `${origin.y}px`);
    root.style.setProperty("--theme-r", `${radius}px`);
    root.classList.add("theme-switching");
    const transition = document.startViewTransition(() => setTheme(theme));
    transition.finished.finally(() => root.classList.remove("theme-switching"));
  } else {
    root.classList.add("theme-transition");
    setTheme(theme);
    // Remove the transition class once the 250ms cross-fade is done.
    window.setTimeout(() => root.classList.remove("theme-transition"), 300);
  }
  if (remember) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Storage can be blocked (private mode); the theme still applies.
    }
  }
}

export function hasSavedTheme(): boolean {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
