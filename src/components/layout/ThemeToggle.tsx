"use client";

import { useTheme } from "@/hooks/useTheme";
import { MoonIcon, SunIcon } from "@/components/ui/icons";
import styles from "./Header.module.css";

/** 44px round button: shows a sun in the dark theme and a moon in the light theme. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button type="button" className={styles.themeToggle} onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        toggle({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }} aria-label={`Switch to ${next} theme`}>
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
