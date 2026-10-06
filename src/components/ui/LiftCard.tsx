"use client";

import { motion } from "motion/react";

// A card (<article>) that lifts slightly when hovered. The faint shadow is in
// each card's CSS (:hover); Motion handles the smooth upward movement.
export function LiftCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.article
      className={className}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.article>
  );
}
