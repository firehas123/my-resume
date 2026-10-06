import Link from "next/link";
import { profile } from "@/lib/profile";
import styles from "./Footer.module.css";

// The footer is rendered when the site is built, so this is the date of the
// latest deploy: the date the site was last updated.
const updated = new Date();
const updatedLabel = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" }).format(updated);

export function Footer() {
  return (
    // band-dark: the footer stays black in both themes.
    <footer className={`band-dark ${styles.footer}`}>
      <div className={`container ${styles.inner}`}>
        <p>{profile.name}</p>
        <p className={styles.note}>
          Updated <time dateTime={updated.toISOString().slice(0, 10)}>{updatedLabel}</time>
        </p>
        <nav aria-label="Legal">
          <ul className={styles.legal}>
            <li>
              {/* A plain link to the top of the page content: works without JavaScript. */}
              <a href="#main" className={`u-link ${styles.backToTop}`}>
                Back to top
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 19V5" />
                  <path d="M6 11l6-6 6 6" />
                </svg>
              </a>
            </li>
            <li>
              <Link href="/impressum" className="u-link">Impressum</Link>
            </li>
            <li>
              <Link href="/datenschutz" className="u-link">Datenschutz</Link>
            </li>
            {/* The stats page is unlisted unless switched on in profile.json. */}
            {profile.showStatsLink && (
              <li>
                <Link href="/stats" className="u-link">Site stats</Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
