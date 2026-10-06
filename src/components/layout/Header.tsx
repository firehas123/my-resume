import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { PillLink } from "@/components/ui/PillLink";
import { profile } from "@/lib/profile";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Header.module.css";

// Paths start with "/" so the links also work from the project and contact pages.
const NAV = [
  { href: "/#about", label: "About" },
  { href: "/#experience", label: "Experience" },
  { href: "/#projects", label: "Projects" },
  { href: "/#skills", label: "Skills" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    // viewTransitionName: the header stays still during page transitions.
    <header className={styles.header} style={{ viewTransitionName: "site-header" }}>
      <div className={`container ${styles.bar}`}>
        <Link href="/#top" className={styles.logo} aria-label={`${profile.shortName}, home`}>
          <Logo height={26} />
        </Link>
        <nav aria-label="Sections" className={styles.nav}>
          <ul className={styles.links}>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.link}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.actions}>
          <ThemeToggle />
          <PillLink href={profile.cv.path} download={profile.cv.downloadName} track="cv" size="small">
            Download CV
          </PillLink>
        </div>
      </div>
    </header>
  );
}
