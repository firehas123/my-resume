import Link from "next/link";
import styles from "./PillLink.module.css";

// A link styled as a pill button. Internal paths use Next's <Link> (no full
// page reload); external URLs and file downloads use a plain <a>.

type PillLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
  size?: "small" | "large";
  /** Set to a file name to download instead of navigating (used for the CV). */
  download?: string;
  /** Click name for the site's own statistics (see VisitTracker). */
  track?: string;
  className?: string;
};

function isExternal(href: string) {
  return /^https?:\/\//.test(href);
}

export function PillLink({
  href,
  children,
  variant = "primary",
  size = "large",
  download,
  track,
  className,
}: PillLinkProps) {
  const classes = [styles.pill, styles[variant], styles[size], className].filter(Boolean).join(" ");

  if (download !== undefined || isExternal(href)) {
    const external = isExternal(href);
    return (
      <a
        href={href}
        className={classes}
        download={download}
        data-track={track}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} data-track={track}>
      {children}
    </Link>
  );
}
