"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

// Fades and slides its content in the first time it scrolls into view.
// The hidden starting state comes from CSS ([data-reveal] in globals.css) and
// only applies when JavaScript runs and motion is allowed, so the content is
// always in the HTML and never stays hidden for crawlers or no-JS visitors.

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Seconds to wait before starting, for gentle staggering. */
  delay?: number;
};

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!inView || reduceMotion || !ref.current) return;
    animate(ref.current, { opacity: [0, 1], y: [24, 0] }, { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] });
  }, [inView, reduceMotion, delay]);

  return (
    <div ref={ref} className={className} data-reveal="">
      {children}
    </div>
  );
}
