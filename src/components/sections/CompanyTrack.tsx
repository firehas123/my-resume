"use client";

import { useRef } from "react";
import { usePushField } from "@/hooks/usePushField";
import styles from "./CompanyStrip.module.css";

export type StripCompany = { name: string; logo: string | null; letterRatio: number };

// Identical copies of the list sit side by side in the track. The track
// slides left by exactly one copy and starts again, which looks like one
// endless line with no jump. Four copies cover screens up to ~3800px wide.
// If you change this number, also change the -25% (= 100% / 4) in the CSS.
const COPIES = 4;

function CompanyList({ companies, hidden }: { companies: StripCompany[]; hidden: boolean }) {
  return (
    <ul className={styles.list} aria-hidden={hidden || undefined}>
      {companies.map((company) => (
        // The <li> rolls with the track (CSS animation); the inner <span> is
        // pushed by the cursor (its own transform), so the two never fight.
        <li key={company.name} className={styles.slot} data-push-anchor="">
          <span className={styles.item} data-push-item="">
            {company.logo ? (
              // A plain <img>: logos are small local files, and SVGs are not
              // processed by Next's image optimiser. The company name is the
              // accessible label (empty on the decorative repeat copies).
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={company.logo}
                alt={hidden ? "" : company.name}
                className={styles.logo}
                style={{ "--letter-ratio": company.letterRatio } as React.CSSProperties}
              />
            ) : (
              <span className={styles.wordmark}>{company.name}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

// The strip never pauses or slows. While it rolls, each logo is pushed gently
// away from a nearby cursor and floats back: the skills cloud's feel, but
// subtler. With "prefers-reduced-motion" there is no rolling and no push.
export function CompanyTrack({ companies }: { companies: StripCompany[] }) {
  const viewport = useRef<HTMLDivElement>(null);

  usePushField(viewport, {
    radius: 150,
    strength: 14,
    coupling: 0.25,
    drift: 0,
    pointerScope: "window",
    ripple: true,
    movingAnchors: true,
  });

  return (
    <div ref={viewport} className={styles.viewport}>
      <div className={styles.track}>
        {Array.from({ length: COPIES }, (_, i) => (
          // Only the first copy is read by screen readers.
          <CompanyList key={i} companies={companies} hidden={i > 0} />
        ))}
      </div>
    </div>
  );
}
