"use client";

import { useEffect, useRef } from "react";

// The hero background: a field of fine dots on a regular grid, brighter
// toward the side away from the text (the right; the left in right-to-left
// languages), with a few in the accent colour. The dots move away from
// the cursor like something pushed through water and float back with a soft,
// slightly springy settle (the same feel as the skills cloud); a tap sends a
// ripple outward. Drawn on a <canvas> with requestAnimationFrame.
//
// Performance: the loop sleeps whenever nothing moves, pauses while the hero
// is off screen, and the canvas is capped at 2x pixel density.
// Reduced motion: drawn once, nothing moves. Phones: no cursor, taps only.

const GAP = 28; // px between dots
const RADIUS = 150; // cursor influence (px)
const STRENGTH = 18; // max push (px)
const STIFFNESS = 90; // same spring as the skills cloud
const DAMPING = 12;
const RIPPLE_SPEED = 900; // px per second
const RIPPLE_LIFE = 1.1; // seconds
const RIPPLE_KICK = 160; // px per second
const REST = 0.05;

type Dot = { hx: number; hy: number; x: number; y: number; vx: number; vy: number; alpha: number; accent: boolean };
type Ripple = { x: number; y: number; start: number; hit: Set<Dot> };

/** Deterministic "random" for a grid position, so the accent dots never jump. */
function noise(col: number, row: number): number {
  const h = Math.imul(col * 73856093 ^ row * 19349663, 2654435761) >>> 0;
  return (h % 1000) / 1000;
}

export function HeroDotField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const host: HTMLCanvasElement = canvas;
    const draw2d: CanvasRenderingContext2D = ctx;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let colors = { text: "#f4f4f5", accent: "#5be3a8" };
    const pointer = { x: 0, y: 0, active: false };
    const ripples: Ripple[] = [];
    let frame = 0;
    let lastTime = 0;
    let visible = true;

    function readColors() {
      const css = getComputedStyle(host);
      colors = {
        text: css.getPropertyValue("--text").trim() || colors.text,
        accent: css.getPropertyValue("--accent").trim() || colors.accent,
      };
    }

    function layout() {
      const rtl = document.documentElement.dir === "rtl";
      const rect = host.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      host.width = Math.round(width * dpr);
      host.height = Math.round(height * dpr);
      draw2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      const cols = Math.ceil(width / GAP);
      const rows = Math.ceil(height / GAP);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const hx = col * GAP + GAP / 2;
          const hy = row * GAP + GAP / 2;
          // 0 at the start of the line (where the text is), 1 at the far end:
          // left to right, or right to left in right-to-left languages.
          // The last column can sit just past the edge; clamp so the
          // brightness never goes out of range (1 - x/width < 0 would be NaN below).
          const t = Math.min(1, Math.max(0, rtl ? 1 - hx / width : hx / width));
          const accent = t > 0.5 && noise(col, row) < 0.035;
          // Faint behind the text, brighter toward the far side.
          const alpha = accent ? 0.9 : 0.05 + Math.pow(t, 1.6) * 0.42;
          dots.push({ hx, hy, x: 0, y: 0, vx: 0, vy: 0, alpha, accent });
        }
      }
    }

    function draw() {
      draw2d.clearRect(0, 0, width, height);
      // Group dots into a few brightness steps, one path each (fast).
      const STEPS = 8;
      const buckets: Dot[][] = Array.from({ length: STEPS }, () => []);
      const accents: Dot[] = [];
      for (const d of dots) {
        if (d.accent) accents.push(d);
        else buckets[Math.min(STEPS - 1, Math.floor((d.alpha / 0.5) * STEPS))].push(d);
      }
      draw2d.fillStyle = colors.text;
      buckets.forEach((bucket, i) => {
        if (!bucket.length) return;
        draw2d.globalAlpha = ((i + 0.5) / STEPS) * 0.5;
        draw2d.beginPath();
        for (const d of bucket) {
          draw2d.moveTo(d.hx + d.x + 1.1, d.hy + d.y);
          draw2d.arc(d.hx + d.x, d.hy + d.y, 1.1, 0, Math.PI * 2);
        }
        draw2d.fill();
      });
      draw2d.globalAlpha = 0.9;
      draw2d.fillStyle = colors.accent;
      draw2d.beginPath();
      for (const d of accents) {
        draw2d.moveTo(d.hx + d.x + 1.8, d.hy + d.y);
        draw2d.arc(d.hx + d.x, d.hy + d.y, 1.8, 0, Math.PI * 2);
      }
      draw2d.fill();
      draw2d.globalAlpha = 1;
    }

    function step(now: number) {
      frame = 0;
      if (!visible) return;
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 1 / 30) : 1 / 60;
      lastTime = now;
      const t = now / 1000;
      let moving = pointer.active || ripples.length > 0;

      for (let r = ripples.length - 1; r >= 0; r--) {
        if (t - ripples[r].start > RIPPLE_LIFE) ripples.splice(r, 1);
      }

      for (const d of dots) {
        let tx = 0;
        let ty = 0;
        if (pointer.active) {
          const dx = d.hx - pointer.x;
          const dy = d.hy - pointer.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          if (dist < RADIUS) {
            const f = 1 - dist / RADIUS;
            tx = (dx / dist) * STRENGTH * f * f;
            ty = (dy / dist) * STRENGTH * f * f;
          }
        }
        for (const wave of ripples) {
          if (wave.hit.has(d)) continue;
          const dx = d.hx - wave.x;
          const dy = d.hy - wave.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          if (dist > (t - wave.start) * RIPPLE_SPEED) continue;
          wave.hit.add(d);
          const kick = RIPPLE_KICK * (1 - (t - wave.start) / RIPPLE_LIFE);
          d.vx += (dx / dist) * kick;
          d.vy += (dy / dist) * kick;
        }
        // Skip the spring maths for dots that are fully at rest.
        if (!tx && !ty && Math.abs(d.x) < REST && Math.abs(d.y) < REST && Math.abs(d.vx) < REST && Math.abs(d.vy) < REST) {
          d.x = d.y = d.vx = d.vy = 0;
          continue;
        }
        d.vx += (STIFFNESS * (tx - d.x) - DAMPING * d.vx) * dt;
        d.vy += (STIFFNESS * (ty - d.y) - DAMPING * d.vy) * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        moving = true;
      }

      draw();
      if (moving) wake();
      else lastTime = 0;
    }

    function wake() {
      if (!frame && visible && !reducedMotion) frame = requestAnimationFrame(step);
    }

    function toLocal(event: PointerEvent) {
      const rect = host.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top, inside: event.clientY >= rect.top && event.clientY <= rect.bottom };
    }

    function onPointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      const p = toLocal(event);
      pointer.x = p.x;
      pointer.y = p.y;
      pointer.active = p.inside;
      wake();
    }

    function onPointerDown(event: PointerEvent) {
      if (event.pointerType !== "touch") return;
      const p = toLocal(event);
      if (!p.inside) return;
      ripples.push({ x: p.x, y: p.y, start: performance.now() / 1000, hit: new Set() });
      wake();
    }

    function onLeave() {
      pointer.active = false;
      wake();
    }

    readColors();
    layout();
    draw();

    const resizeObserver = new ResizeObserver(() => {
      layout();
      draw();
    });
    resizeObserver.observe(host);
    // Repaint in the new colours when the theme changes.
    const themeObserver = new MutationObserver(() => {
      requestAnimationFrame(() => {
        readColors();
        draw();
      });
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    if (reducedMotion) {
      return () => {
        resizeObserver.disconnect();
        themeObserver.disconnect();
      };
    }

    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
      else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
      }
    });
    intersection.observe(host);
    if (finePointer) window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onPointerDown, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
