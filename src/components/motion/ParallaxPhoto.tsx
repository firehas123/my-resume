"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { useRichMotion } from "@/hooks/useMediaQuery";

// About photo: moves a little slower than the text (parallax) and settles
// from slightly enlarged to its normal size as the section enters.
// Transform only; off on phones and with reduced motion.
export function ParallaxPhoto({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rich = useRichMotion();
  // 0 as the section's top enters at the bottom of the screen, 1 as its bottom leaves at the top.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  // The edges this exposes are always off screen at that moment (entering: the
  // bottom edge is not visible yet; leaving: the top edge is gone).
  const y = useTransform(scrollYProgress, [0, 1], [-28, 28]);
  const scale = useTransform(scrollYProgress, [0, 0.45], [1.08, 1], { clamp: true });

  return (
    <motion.div ref={ref} className={className} style={rich ? { y, scale } : undefined}>
      {children}
    </motion.div>
  );
}
