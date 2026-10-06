"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef } from "react";
import { useRichMotion } from "@/hooks/useMediaQuery";

// Makes a main button slightly magnetic: it leans a few pixels toward a
// nearby cursor and springs back when the cursor moves away. Transform only;
// desktop with motion allowed only.
const RANGE = 90; // px around the button where the pull is felt
const MAX_SHIFT = 6; // px
const SPRING = { stiffness: 220, damping: 18, mass: 0.5 };

export function Magnetic({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const rich = useRichMotion();
  const x = useSpring(useMotionValue(0), SPRING);
  const y = useSpring(useMotionValue(0), SPRING);

  useEffect(() => {
    if (!rich) return;
    const onMove = (event: PointerEvent) => {
      const el = ref.current;
      if (!el || event.pointerType !== "mouse") return;
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      // Distance from the button's edge, not its centre.
      const outside = Math.hypot(Math.max(0, Math.abs(dx) - rect.width / 2), Math.max(0, Math.abs(dy) - rect.height / 2));
      if (outside > RANGE) {
        x.set(0);
        y.set(0);
        return;
      }
      const pull = 1 - outside / RANGE;
      x.set(Math.max(-1, Math.min(1, dx / (rect.width / 2))) * MAX_SHIFT * pull);
      y.set(Math.max(-1, Math.min(1, dy / (rect.height / 2))) * MAX_SHIFT * pull);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [rich, x, y]);

  return (
    <motion.span ref={ref} style={{ display: "inline-flex", x, y }}>
      {children}
    </motion.span>
  );
}
