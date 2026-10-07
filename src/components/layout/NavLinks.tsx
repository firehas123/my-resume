"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import styles from "./Header.module.css";

/** A section of the home page ("about"), or a page of its own ("/contact"). */
type NavItem = { label: string } & ({ section: string; page?: never } | { page: "/contact"; section?: never });

/** The header links; the one for the section in view (or the current page) is highlighted. */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname(); // without the language, e.g. "/" or "/contact"
  const [inView, setInView] = useState<string | null>(null);
  const onHome = pathname === "/";

  // On the home page, watch which section is in the middle of the screen.
  useEffect(() => {
    if (!onHome) return;
    const ids = items.map((i) => i.section).filter((id): id is string => Boolean(id));
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
  }, [onHome, items]);

  return (
    <ul className={styles.links}>
      {items.map((item) => {
        const active = item.section ? onHome && item.section === inView : pathname === item.page;
        return (
          <li key={item.section ?? item.page}>
            <Link
              href={item.section ? { pathname: "/", hash: item.section } : item.page!}
              className={styles.link}
              aria-current={active ? (item.section ? "location" : "page") : undefined}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
