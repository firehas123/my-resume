"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { useRichMotion } from "@/hooks/useMediaQuery";

// Hero: as you scroll away, its content eases back and fades slightly.
// Driven directly by the scroll position (no timers), transform and opacity
// only. Off on phones and with reduced motion.
export function ScrollEaseBack({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rich = useRichMotion();
  // 0 when the content's top meets the top of the screen, 1 when its bottom does.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);
  // Derived from the movement (not straight from the scroll position), so the
  // fade always stays in step with it.
  const opacity = useTransform(y, [0, -70], [1, 0.45]);

  return (
    <motion.div ref={ref} className={className} style={rich ? { y, scale, opacity, transformOrigin: "var(--start) top" } : undefined}>
      {children}
    </motion.div>
  );
}
