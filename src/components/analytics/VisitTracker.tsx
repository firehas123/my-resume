"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { statsPath } from "@/lib/stats/paths";

// Sends page views and a few clicks to /api/visit for the site's own,
// privacy-friendly statistics (see src/app/api/visit/route.ts).
//
// VISIT vs PAGE VIEW: a module-level variable lives in the page's memory for
// as long as the tab keeps this site loaded. The first page view of a full
// load is also a visit; moving between pages inside the site is not.
// No cookies, no localStorage/sessionStorage for tracking, no identifier.
let visitCounted = false;
let lastSentPath: string | null = null;

/** Set by /stats?exclude-me=1 so the site owner's own visits are not counted. */
export const EXCLUDE_ME_KEY = "stats-exclude-me";

function shouldSkip(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.doNotTrack === "1" || nav.globalPrivacyControl === true) return true;
  if (nav.webdriver) return true; // automated browsers
  try {
    if (localStorage.getItem(EXCLUDE_ME_KEY) === "1") return true;
  } catch {
    // Storage blocked: just count normally.
  }
  return false;
}

function deviceType(): "phone" | "tablet" | "desktop" {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const shortSide = Math.min(window.screen.width, window.screen.height);
  if (coarse && shortSide < 600) return "phone";
  if (coarse && shortSide < 1100) return "tablet";
  return "desktop";
}

/** Only the referring site's domain, and only if it is another site. */
function referrerDomain(): string {
  try {
    const host = new URL(document.referrer).hostname;
    return host === location.hostname ? "" : host;
  } catch {
    return "";
  }
}

function send(payload: Record<string, unknown>) {
  // keepalive lets the request finish even if the visitor leaves the page.
  fetch("/api/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

export function VisitTracker({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();

  // One page view per page; the first one in this tab is also the visit.
  // The page is sent without its language ("/contact"), the language separately ("de").
  useEffect(() => {
    if (!enabled || !pathname || shouldSkip()) return;
    const { path, lang } = statsPath(pathname);
    if (path.startsWith("/stats")) return;
    if (pathname === lastSentPath) return; // guard against double effects
    lastSentPath = pathname;
    if (!visitCounted) {
      visitCounted = true;
      send({
        kind: "view",
        path,
        lang,
        newVisit: true,
        device: deviceType(),
        theme: document.documentElement.dataset.theme === "light" ? "light" : "dark",
        referrer: referrerDomain(),
      });
    } else {
      send({ kind: "view", path, lang, newVisit: false });
    }
  }, [enabled, pathname]);

  // Clicks on elements marked data-track="cv-<language>|linkedin|github|ask".
  useEffect(() => {
    if (!enabled) return;
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest?.("[data-track]");
      const name = target?.getAttribute("data-track");
      if (!name || statsPath(location.pathname).path.startsWith("/stats") || shouldSkip()) return;
      send({ kind: "event", name });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [enabled]);

  return null;
}
