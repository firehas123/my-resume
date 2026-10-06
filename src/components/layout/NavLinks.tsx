"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./Header.module.css";

type NavItem = { href: string; label: string };

/** The header links; the one for the section in view (or the current page) is highlighted. */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [inView, setInView] = useState<string | null>(null);

  // On the home page, watch which section is in the middle of the screen.
  useEffect(() => {
    if (pathname !== "/") return;
    const ids = items.map((i) => i.href.split("#")[1]).filter(Boolean);
    const sections = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible.set(entry.target.id, entry.isIntersecting);
        // The first section (in page order) that crosses the middle band.
        setInView(ids.find((id) => visible.get(id)) ?? null);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [pathname, items]);

  return (
    <ul className={styles.links}>
      {items.map((item) => {
        const id = item.href.split("#")[1];
        const active = pathname === "/" ? id !== undefined && id === inView : pathname === item.href;
        return (
          <li key={item.href}>
            <Link href={item.href} className={styles.link} aria-current={active ? (id ? "location" : "page") : undefined}>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
