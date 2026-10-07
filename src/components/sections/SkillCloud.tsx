"use client";

import { useEffect, useRef } from "react";
import { usePushField } from "@/hooks/usePushField";
import type { Skill } from "@/lib/profile";
import type { SkillIcon } from "@/lib/skillIcons";
import styles from "./Skills.module.css";

// Small fixed vertical offsets (px), repeated across the pills, so the cloud
// looks loose instead of sitting on straight lines. Fixed values (not random)
// keep the server and browser HTML identical. The largest difference (26px)
// stays below the row gap in Skills.module.css, so pills never overlap.
const OFFSETS = [0, 12, -6, 6, -12, 10, -4, 14, -8, 4];

const SIZE_CLASS = { 1: styles.small, 2: styles.medium, 3: styles.large } as const;

export type CloudSkill = { name: string; size: Skill["size"]; icons: SkillIcon[] };

/** One technology logo, drawn in the text colour; brand colour on hover. */
function Icon({ icon }: { icon: SkillIcon }) {
  // CSS variables carry the per-logo values; the CSS module does the rest.
  const style = {
    "--icon": `url("${icon.src}")`,
    "--aspect": icon.aspect,
    ...(icon.brandDark ? { "--brand-dark": icon.brandDark } : {}),
    ...(icon.brandLight ? { "--brand-light": icon.brandLight } : {}),
  } as React.CSSProperties;
  return <span className={styles.icon} style={style} aria-hidden="true" />;
}

export function SkillCloud({ skills, label }: { skills: CloudSkill[]; label: string }) {
  const cloud = useRef<HTMLUListElement>(null);

  usePushField(cloud, {
    radius: 200,
    strength: 42,
    coupling: 0.35,
    drift: 6,
    pointerScope: "window",
    ripple: true,
  });

  // Pop in with a short stagger when the cloud enters, then float as usual.
  useEffect(() => {
    const el = cloud.current;
    if (!el) return;
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.setAttribute("data-in", "");
        observer.disconnect();
        // Once the pills have settled, let the push effect re-measure where
        // they rest (it measured them mid-animation).
        timer = window.setTimeout(() => window.dispatchEvent(new Event("resize")), 1400);
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <ul ref={cloud} className={styles.cloud} aria-label={label}>
      {skills.map((skill, i) => (
        <li
          key={skill.name}
          className={styles.anchor}
          data-push-anchor=""
          style={{ "--offset": OFFSETS[i % OFFSETS.length], "--i": i } as React.CSSProperties}
        >
          <span className={`${styles.pill} ${SIZE_CLASS[skill.size]}`} data-push-item="">
            {skill.icons.length > 0 && (
              <span className={styles.icons}>
                {skill.icons.map((icon) => (
                  <Icon key={icon.src} icon={icon} />
                ))}
              </span>
            )}
            {skill.name}
          </span>
        </li>
      ))}
    </ul>
  );
}
