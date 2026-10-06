"use client";

import { useEffect, useRef } from "react";

// Headlines that reveal as their section scrolls into view.
//
//   mode="lines"    each visual line rises from behind a mask, one after
//                   another (words are grouped into lines after layout)
//   mode="letters"  the letters arrive one after another
//
// The full text is always in the HTML (search engines, no JavaScript). It is
// only hidden, by CSS in globals.css, when JavaScript runs and the visitor has
// not asked for reduced motion. Only transform and opacity animate: no
// layout shift.

type RevealTextProps = {
  as?: "h1" | "h2" | "h3" | "p";
  text: string;
  /** Words from this index on are wrapped in the accent class (e.g. "touch."). */
  accentFrom?: number;
  accentClassName?: string;
  mode?: "lines" | "letters";
  className?: string;
  id?: string;
};

export function RevealText({ as = "h2", text, accentFrom, accentClassName, mode = "lines", className, id }: RevealTextProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (mode === "lines") {
      // Group words by their top position to know which line each is on.
      const words = [...el.querySelectorAll<HTMLElement>("[data-word]")];
      let line = -1;
      let lastTop = -Infinity;
      for (const word of words) {
        if (word.offsetTop > lastTop + 4) {
          line += 1;
          lastTop = word.offsetTop;
        }
        word.style.setProperty("--line", String(line));
      }
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.setAttribute("data-in", "");
        observer.disconnect();
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mode]);

  const words = text.split(" ");
  let letterIndex = 0;
  const content = words.map((word, i) => {
    const accent = accentFrom !== undefined && i >= accentFrom ? accentClassName : undefined;
    const inner =
      mode === "letters"
        ? [...word].map((char) => (
            <span key={letterIndex} className="reveal-letter" style={{ "--i": letterIndex++ } as React.CSSProperties} aria-hidden="true">
              {char}
            </span>
          ))
        : word;
    return (
      <span key={i}>
        {/* The outer span is the mask; the inner one moves. */}
        <span className={`reveal-word ${accent ?? ""}`} data-word="">
          <span className="reveal-inner">{inner}</span>
        </span>
        {i < words.length - 1 ? " " : ""}
      </span>
    );
  });

  const Tag = as;
  return (
    <Tag
      // One ref type for any of the allowed tags.
      ref={ref as React.Ref<never>}
      id={id}
      className={className}
      data-reveal-text={mode}
      // Letters are hidden from screen readers individually; read the whole text.
      aria-label={mode === "letters" ? text : undefined}
    >
      {content}
    </Tag>
  );
}
