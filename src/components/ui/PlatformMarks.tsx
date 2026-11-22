// The platforms a project runs on (e.g. Android and iOS), each as a small
// label with its mark. The marks are the Devicon logos, drawn in the text
// colour the same way as in the skills cloud. Data comes from "platforms" in
// src/data/overrides.json (see src/lib/projects.ts). No hooks, so it works
// in server and client components alike.

import type { SkillIcon } from "@/lib/skillIcons";
import styles from "./PlatformMarks.module.css";

export type PlatformMark = { id: string; label: string; icon: SkillIcon };

export function PlatformMarks({ platforms, label, size = "small" }: { platforms: PlatformMark[]; label: string; size?: "small" | "large" }) {
  if (platforms.length === 0) return null;
  return (
    <ul className={`${styles.list} ${size === "large" ? styles.large : ""}`} aria-label={label}>
      {platforms.map((p) => (
        <li key={p.id} dir="ltr">
          <span
            className={styles.mark}
            style={{ "--icon": `url("${p.icon.src}")`, "--aspect": p.icon.aspect } as React.CSSProperties}
            aria-hidden="true"
          />
          {p.label}
        </li>
      ))}
    </ul>
  );
}
