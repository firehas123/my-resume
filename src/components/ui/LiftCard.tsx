"use client";

import { DURATION, EASE_OUT } from "@/lib/motion";
import { motion } from "motion/react";

// A card (<article>) that lifts slightly when hovered. The faint shadow is in
// each card's CSS (:hover); Motion handles the smooth upward movement.
export function LiftCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.article
      className={className}
      whileHover={{ y: -4 }}
      transition={{ duration: DURATION.standard, ease: EASE_OUT }}
    >
      {children}
    </motion.article>
  );
}
