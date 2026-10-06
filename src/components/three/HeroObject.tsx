"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useTheme } from "@/hooks/useTheme";

// The one 3D element: a slowly turning geodesic wireframe in the theme's text
// colour, with its vertices picked out in the accent colour. It leans gently
// towards the cursor. Loaded lazily by HeroObjectSlot; never server-rendered.

type Colors = { line: string; point: string };

/** Reads the current theme colours from the CSS variables. */
function readColors(element: HTMLElement): Colors {
  const css = getComputedStyle(element);
  return {
    line: css.getPropertyValue("--text").trim() || "#f4f4f5",
    point: css.getPropertyValue("--accent").trim() || "#5be3a8",
  };
}

function Geodesic({ colors, pointer }: { colors: Colors; pointer: React.RefObject<THREE.Vector2> }) {
  const group = useRef<THREE.Group>(null);

  // Build the geometry once. EdgesGeometry gives clean lines without the
  // diagonal triangle edges a plain wireframe would show.
  const { edges, points } = useMemo(() => {
    const shape = new THREE.IcosahedronGeometry(1.55, 1);
    return { edges: new THREE.EdgesGeometry(shape), points: shape };
  }, []);

  useEffect(() => () => {
    edges.dispose();
    points.dispose();
  }, [edges, points]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    // Slow constant turn, plus a soft lean towards the pointer.
    g.rotation.y += delta * 0.18;
    const targetX = pointer.current.y * 0.25;
    const targetZ = -pointer.current.x * 0.15;
    // Move a small part of the way each frame: a smooth ease towards the target.
    g.rotation.x += (targetX - g.rotation.x) * Math.min(1, delta * 2.5);
    g.rotation.z += (targetZ - g.rotation.z) * Math.min(1, delta * 2.5);
  });

  return (
    <group ref={group}>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={colors.line} transparent opacity={0.4} />
      </lineSegments>
      <points geometry={points}>
        <pointsMaterial color={colors.point} size={0.06} sizeAttenuation />
      </points>
    </group>
  );
}

export default function HeroObject() {
  const wrapper = useRef<HTMLDivElement>(null);
  const pointer = useRef(new THREE.Vector2(0, 0));
  const { theme } = useTheme();
  const [colors, setColors] = useState<Colors>({ line: "#f4f4f5", point: "#5be3a8" });
  const [visible, setVisible] = useState(true);

  // Re-read the colours whenever the theme changes.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (wrapper.current) setColors(readColors(wrapper.current));
    });
    return () => cancelAnimationFrame(id);
  }, [theme]);

  // Pause rendering while the hero is scrolled out of view.
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Track the pointer across the whole window, as -1..1 from the centre.
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        (event.clientY / window.innerHeight) * 2 - 1,
      );
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div ref={wrapper} style={{ width: "100%", height: "100%" }}>
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 4.4], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      >
        <Geodesic colors={colors} pointer={pointer} />
      </Canvas>
    </div>
  );
}
