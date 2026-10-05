"use client";

import { useRef } from "react";
import { usePushField } from "@/hooks/usePushField";
import styles from "./CompanyStrip.module.css";

export type StripCompany = { name: string; logo: string | null };

// Number of copies of the list in the sliding track. The track moves left by
// exactly one copy and then restarts, which looks like an endless loop.
// The list is short, so several copies are needed to fill wide screens.
const COPIES = 4;

function CompanyList({ companies, hidden }: { companies: StripCompany[]; hidden: boolean }) {
  return (
    <ul className={styles.list} aria-hidden={hidden || undefined}>
      {companies.map((company) => (
        <li key={company.name} className={styles.slot} data-push-anchor="">
          <span className={styles.item} data-push-item="">
            {company.logo ? (
              // A plain <img>: logos are small local files, and SVGs are not
              // processed by Next's image optimiser.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo} alt={hidden ? "" : company.name} className={styles.logo} />
            ) : (
              <span className={styles.wordmark}>{company.name}</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function CompanyTrack({ companies }: { companies: StripCompany[] }) {
  const viewport = useRef<HTMLDivElement>(null);

  // A much gentler version of the skills-cloud push, only while hovering
  // (the strip pauses then, so the logos hold still under the cursor).
  usePushField(viewport, {
    radius: 200,
    strength: 14,
    coupling: 0.2,
    drift: 0,
    pointerScope: "container",
    ripple: true,
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
