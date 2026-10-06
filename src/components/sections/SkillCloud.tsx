"use client";

import { useRef } from "react";
import { usePushField } from "@/hooks/usePushField";
import type { Skill } from "@/lib/profile";
import styles from "./Skills.module.css";

// Small fixed vertical offsets (px), repeated across the pills, so the cloud
// looks loose instead of sitting on straight lines. Fixed values (not random)
// keep the server and browser HTML identical. The largest difference (26px)
// stays below the row gap in Skills.module.css, so pills never overlap.
const OFFSETS = [0, 12, -6, 6, -12, 10, -4, 14, -8, 4];

const SIZE_CLASS = { 1: styles.small, 2: styles.medium, 3: styles.large } as const;

export function SkillCloud({ skills }: { skills: Skill[] }) {
  const cloud = useRef<HTMLUListElement>(null);

  usePushField(cloud, {
    radius: 200,
    strength: 42,
    coupling: 0.35,
    drift: 6,
    pointerScope: "window",
    ripple: true,
  });

  return (
    <ul ref={cloud} className={styles.cloud} aria-label="Languages and tools">
      {skills.map((skill, i) => (
        <li
          key={skill.name}
          className={styles.anchor}
          data-push-anchor=""
          style={{ "--offset": OFFSETS[i % OFFSETS.length] } as React.CSSProperties}
        >
          <span className={`${styles.pill} ${SIZE_CLASS[skill.size]}`} data-push-item="">
            {skill.name}
          </span>
        </li>
      ))}
    </ul>
  );
}
