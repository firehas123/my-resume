"use client";

import { motion, useReducedMotion, useScroll } from "motion/react";
import { useEffect, useRef } from "react";

// Experience: a thin vertical line that draws itself down the section as you
// scroll, and a dot beside each job that lights up when its card comes into
// view. Elements marked data-job get data-lit when they enter.
export function Timeline({ children, className, lineClassName, progressClassName }: {
  children: React.ReactNode;
  className?: string;
  lineClassName?: string;
  progressClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  // 0 when the list's top reaches 75% down the screen, 1 when its end reaches 55%.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });

  useEffect(() => {
    const jobs = ref.current?.querySelectorAll<HTMLElement>("[data-job]") ?? [];
    if (reduceMotion) {
      jobs.forEach((job) => job.setAttribute("data-lit", ""));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-lit", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -35% 0px" },
    );
    jobs.forEach((job) => observer.observe(job));
    return () => observer.disconnect();
  }, [reduceMotion]);

  return (
    <div ref={ref} className={className}>
      <span className={lineClassName} aria-hidden="true">
        <motion.span className={progressClassName} style={{ scaleY: reduceMotion ? 1 : scrollYProgress }} />
      </span>
      {children}
    </div>
  );
}
