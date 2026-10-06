"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { useRichMotion } from "@/hooks/useMediaQuery";
import { DURATION, EASE_OUT } from "@/lib/motion";
import styles from "./TiltCard.module.css";

// A card that tilts a few degrees toward the cursor, with a soft light that
// follows it, and settles back when the cursor leaves. Transforms only.
// Without a fine pointer (phones) or with reduced motion it is a plain card
// that lifts slightly on hover, like the others.
const MAX_TILT = 4; // degrees
const SPRING = { stiffness: 170, damping: 22, mass: 0.6 };

export function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const rich = useRichMotion();
  // Pointer position over the card, 0..1 on each axis (0.5 = centre).
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const hover = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [0, 1], [MAX_TILT, -MAX_TILT]), SPRING);
  const rotateY = useSpring(useTransform(px, [0, 1], [-MAX_TILT, MAX_TILT]), SPRING);
  const lift = useSpring(useTransform(hover, [0, 1], [0, -4]), SPRING);
  const lightOpacity = useSpring(hover, SPRING);
  // The light is a large soft circle moved (transform) to the pointer.
  const lightX = useTransform(px, (v) => `${(v - 0.5) * 100}%`);
  const lightY = useTransform(py, (v) => `${(v - 0.5) * 100}%`);

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    if (!rich || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width);
    py.set((event.clientY - rect.top) / rect.height);
    hover.set(1);
  }

  function onPointerLeave() {
    px.set(0.5);
    py.set(0.5);
    hover.set(0);
  }

  if (!rich) {
    return (
      <motion.article className={className} whileHover={{ y: -4 }} transition={{ duration: DURATION.standard, ease: EASE_OUT }}>
        {children}
      </motion.article>
    );
  }

  return (
    <motion.article
      ref={ref}
      className={`${className ?? ""} ${styles.tilt}`}
      style={{ rotateX, rotateY, y: lift, transformPerspective: 900 }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
      <motion.span className={styles.light} style={{ x: lightX, y: lightY, opacity: lightOpacity }} aria-hidden="true" />
    </motion.article>
  );
}
