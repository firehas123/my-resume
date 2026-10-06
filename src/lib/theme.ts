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

/** Applies a theme with a short colour cross-fade, and remembers the choice. */
export function applyTheme(theme: Theme, remember: boolean) {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  root.dataset.theme = theme;
  // Remove the transition class once the 250ms cross-fade is done.
  window.setTimeout(() => root.classList.remove("theme-transition"), 300);
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
