"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// three.js is large, so it lives in its own chunk that is only downloaded when
// all of these are true: the browser is idle, the screen is wide enough to
// show it, the visitor has not asked for reduced motion, and WebGL works.
// Until then (or if never), the slot is an empty box of the same size, so the
// layout never jumps and the page never waits for 3D.
const HeroObject = dynamic(() => import("./HeroObject"), { ssr: false });

const MIN_WIDTH_QUERY = "(min-width: 900px)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

// requestIdleCallback is missing in some Safari versions; fall back to a timeout.
function whenIdle(callback: () => void): () => void {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(callback, { timeout: 2500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(callback, 1200);
  return () => clearTimeout(id);
}

export function HeroObjectSlot({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia(MIN_WIDTH_QUERY);
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY);
    let cancelIdle: (() => void) | undefined;

    const update = () => {
      cancelIdle?.();
      cancelIdle = undefined;
      if (!wide.matches || reduced.matches) {
        setEnabled(false);
        return;
      }
      cancelIdle = whenIdle(() => setEnabled(supportsWebGL()));
    };

    update();
    wide.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      cancelIdle?.();
      wide.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  return <div className={className} aria-hidden="true">{enabled && <HeroObject />}</div>;
}
