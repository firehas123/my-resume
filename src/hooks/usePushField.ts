"use client";

import { useEffect, type RefObject } from "react";

// "Pushing something through water without touching it."
//
// Items inside the container move away from the cursor before it reaches
// them: the closer the cursor, the stronger the push. Each item is tied to its
// home position by a soft spring, so when the cursor leaves it floats back
// with a slight, gentle overshoot. Neighbours share a little of each other's
// push, so the group moves like one fluid surface.
//
// Markup the hook expects:
//   <container>
//     <element data-push-anchor>      never transformed, used for measuring
//       <element data-push-item>      the part that actually moves
//
// Performance: one requestAnimationFrame loop, transforms only (no layout
// changes), positions measured only when something changed (scroll, resize,
// pointer entering), and the loop stops while the container is off screen.
// With "prefers-reduced-motion" nothing moves at all.

export type PushFieldOptions = {
  /** How far (px) the cursor's influence reaches. */
  radius: number;
  /** Maximum push (px) when the cursor is right on an item. */
  strength: number;
  /** 0..1: how much each item follows its neighbours' push. */
  coupling: number;
  /** Amplitude (px) of the idle drifting. 0 turns drifting off. */
  drift: number;
  /**
   * "window": react to the cursor anywhere nearby (items move before the
   * cursor even enters). "container": only while the cursor is inside
   * (used by the sliding company strip, whose positions change while sliding).
   */
  pointerScope: "window" | "container";
  /** On touch screens a tap sends a small ripple outward from the tap point. */
  ripple: boolean;
};

// Spring settings shared by every field: an under-damped spring (damping
// ratio about 0.6) gives the soft, slightly springy settle.
const STIFFNESS = 90;
const DAMPING = 12;
const NEIGHBOUR_RADIUS = 220; // px within which items influence each other
const RIPPLE_SPEED = 700; // px per second
const RIPPLE_LIFE = 0.9; // seconds
const RIPPLE_KICK = 320; // px per second added to an item's velocity
const REST_EPSILON = 0.05; // below this (px and px/s) an item counts as still

type Item = {
  anchor: HTMLElement;
  el: HTMLElement;
  cx: number; // home centre, in viewport (client) coordinates
  cy: number;
  x: number; // current offset from home
  y: number;
  vx: number;
  vy: number;
  pushX: number; // this frame's cursor push, before neighbour sharing
  pushY: number;
  phase: number; // makes each item drift differently
  speed: number;
};

type Ripple = { x: number; y: number; start: number; hit: Set<Item> };

export function usePushField(containerRef: RefObject<HTMLElement | null>, options: PushFieldOptions) {
  const { radius, strength, coupling, drift, pointerScope, ripple } = options;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    // A separately typed constant, so the nested functions below know it is never null.
    const container: HTMLElement = element;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const items: Item[] = Array.from(container.querySelectorAll<HTMLElement>("[data-push-anchor]")).flatMap(
      (anchor, index) => {
        const el = anchor.querySelector<HTMLElement>("[data-push-item]");
        if (!el) return [];
        // Deterministic "random" values from the index (the golden ratio
        // spreads them evenly), so drifting looks natural but never jumps.
        const phase = (index * 2.39996) % (Math.PI * 2);
        const speed = 0.75 + ((index * 0.618) % 1) * 0.5;
        return [{ anchor, el, cx: 0, cy: 0, x: 0, y: 0, vx: 0, vy: 0, pushX: 0, pushY: 0, phase, speed }];
      },
    );
    if (items.length === 0) return;

    const pointer = { x: 0, y: 0, active: false };
    const ripples: Ripple[] = [];
    let needsMeasure = true;
    let visible = false;
    let frame = 0;
    let lastTime = 0;

    // Home positions = the anchors' centres. Anchors are never transformed by
    // this hook, so their rectangles are the true resting places.
    function measure() {
      for (const item of items) {
        const rect = item.anchor.getBoundingClientRect();
        item.cx = rect.left + rect.width / 2;
        item.cy = rect.top + rect.height / 2;
      }
      needsMeasure = false;
    }

    function step(now: number) {
      frame = 0;
      if (!visible) return;
      if (needsMeasure) measure();

      // Seconds since the last frame, capped so a background tab does not
      // make items jump when it becomes active again.
      const dt = lastTime ? Math.min((now - lastTime) / 1000, 1 / 30) : 1 / 60;
      lastTime = now;
      const t = now / 1000;

      // 1. Direct push from the cursor, strongest when closest.
      for (const item of items) {
        item.pushX = 0;
        item.pushY = 0;
        if (!pointer.active) continue;
        const dx = item.cx - pointer.x;
        const dy = item.cy - pointer.y;
        const distance = Math.hypot(dx, dy) || 0.001;
        if (distance >= radius) continue;
        const falloff = 1 - distance / radius;
        const push = strength * falloff * falloff; // eases in as the cursor nears
        item.pushX = (dx / distance) * push;
        item.pushY = (dy / distance) * push;
      }

      // 2. Ripples from taps: each item gets one outward kick as the ring passes.
      for (let r = ripples.length - 1; r >= 0; r--) {
        const wave = ripples[r];
        const age = t - wave.start;
        if (age > RIPPLE_LIFE) {
          ripples.splice(r, 1);
          continue;
        }
        const ringRadius = age * RIPPLE_SPEED;
        for (const item of items) {
          if (wave.hit.has(item)) continue;
          const dx = item.cx - wave.x;
          const dy = item.cy - wave.y;
          const distance = Math.hypot(dx, dy) || 0.001;
          if (distance > ringRadius) continue;
          wave.hit.add(item);
          const kick = RIPPLE_KICK * (1 - age / RIPPLE_LIFE);
          item.vx += (dx / distance) * kick;
          item.vy += (dy / distance) * kick;
        }
      }

      // 3. Spring each item towards its target: drift + own push + a share
      //    of its neighbours' push (the "fluid surface" feel).
      let moving = ripples.length > 0 || drift > 0;
      for (const item of items) {
        let shareX = 0;
        let shareY = 0;
        let weights = 0;
        if (coupling > 0) {
          for (const other of items) {
            if (other === item) continue;
            const d = Math.hypot(other.cx - item.cx, other.cy - item.cy);
            if (d >= NEIGHBOUR_RADIUS) continue;
            const w = 1 - d / NEIGHBOUR_RADIUS;
            shareX += other.pushX * w;
            shareY += other.pushY * w;
            weights += w;
          }
        }
        let targetX = item.pushX + (weights ? (coupling * shareX) / weights : 0);
        let targetY = item.pushY + (weights ? (coupling * shareY) / weights : 0);
        if (drift > 0) {
          targetX += drift * Math.sin(t * 0.5 * item.speed + item.phase);
          targetY += drift * 0.8 * Math.cos(t * 0.4 * item.speed + item.phase * 1.3);
        }

        const ax = STIFFNESS * (targetX - item.x) - DAMPING * item.vx;
        const ay = STIFFNESS * (targetY - item.y) - DAMPING * item.vy;
        item.vx += ax * dt;
        item.vy += ay * dt;
        item.x += item.vx * dt;
        item.y += item.vy * dt;

        const still =
          Math.abs(targetX - item.x) < REST_EPSILON &&
          Math.abs(targetY - item.y) < REST_EPSILON &&
          Math.abs(item.vx) < REST_EPSILON &&
          Math.abs(item.vy) < REST_EPSILON;
        if (!still) moving = true;

        item.el.style.transform = `translate3d(${item.x.toFixed(2)}px, ${item.y.toFixed(2)}px, 0)`;
      }

      // Keep animating while anything moves or the cursor is in play;
      // otherwise sleep until the next pointer event.
      if (moving || pointer.active) wake();
      else lastTime = 0;
    }

    function wake() {
      if (!frame && visible) frame = requestAnimationFrame(step);
    }

    // --- Pointer handling --------------------------------------------------
    const pointerTarget: HTMLElement | Window = pointerScope === "window" ? window : container;

    function onPointerMove(event: Event) {
      const e = event as PointerEvent;
      if (e.pointerType === "touch") return; // touch uses ripples instead
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (pointerScope === "window") {
        // Only "active" while near the container, to avoid needless work.
        const rect = container.getBoundingClientRect();
        pointer.active =
          e.clientX > rect.left - radius &&
          e.clientX < rect.right + radius &&
          e.clientY > rect.top - radius &&
          e.clientY < rect.bottom + radius;
      } else {
        pointer.active = true;
      }
      if (pointer.active) wake();
    }

    function onPointerEnter() {
      needsMeasure = true; // the strip has just paused; measure where items are now
    }

    function onPointerLeave(event: Event) {
      if ((event as PointerEvent).pointerType === "touch") return;
      pointer.active = false;
      wake(); // let the items float home
    }

    function onPointerDown(event: Event) {
      const e = event as PointerEvent;
      if (!ripple || e.pointerType !== "touch") return;
      needsMeasure = true;
      ripples.push({ x: e.clientX, y: e.clientY, start: performance.now() / 1000, hit: new Set() });
      wake();
    }

    function onLayoutChange() {
      needsMeasure = true;
    }

    pointerTarget.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerenter", onPointerEnter);
    container.addEventListener("pointerdown", onPointerDown, { passive: true });
    if (pointerScope === "container") container.addEventListener("pointerleave", onPointerLeave);
    else document.documentElement.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("scroll", onLayoutChange, { passive: true });
    window.addEventListener("resize", onLayoutChange);

    // Run only while the container is on screen.
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        needsMeasure = true;
        wake();
      } else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
        lastTime = 0;
      }
    });
    observer.observe(container);

    // If the visitor switches on reduced motion mid-visit, stop and reset.
    function onReducedMotionChange() {
      if (!reducedMotion.matches) return;
      visible = false;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      for (const item of items) item.el.style.transform = "";
    }
    reducedMotion.addEventListener("change", onReducedMotionChange);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer.disconnect();
      pointerTarget.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerenter", onPointerEnter);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointerleave", onPointerLeave);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onLayoutChange);
      window.removeEventListener("resize", onLayoutChange);
      reducedMotion.removeEventListener("change", onReducedMotionChange);
      for (const item of items) item.el.style.transform = "";
    };
  }, [containerRef, radius, strength, coupling, drift, pointerScope, ripple]);
}
