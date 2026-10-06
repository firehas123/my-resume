import Link from "next/link";
import { profile } from "@/lib/profile";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    // band-dark: the footer stays black in both themes.
    <footer className={`band-dark ${styles.footer}`}>
      <div className={`container ${styles.inner}`}>
        <p>{profile.name}</p>
        <p className={styles.note}>Projects are pulled from GitHub</p>
        <nav aria-label="Legal">
          <ul className={styles.legal}>
            <li>
              <Link href="/impressum">Impressum</Link>
            </li>
            <li>
              <Link href="/datenschutz">Datenschutz</Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
