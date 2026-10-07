import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import styles from "./PillLink.module.css";

// A link styled as a pill button. Pages of this site use the language-aware
// <Link> (no full page reload, keeps the current language); external URLs
// and file downloads use a plain <a>.

type PageHref = ComponentProps<typeof Link>["href"];

type PillLinkProps = {
  /** A page of this site ("/contact", { pathname: "/", hash: "projects" }), an external URL or a file. */
  href: PageHref | string;
  children: React.ReactNode;
  variant?: "primary" | "outline";
  size?: "small" | "large";
  /** Set to a file name to download instead of navigating (used for the CV). */
  download?: string;
  /** Click name for the site's own statistics (see VisitTracker). */
  track?: string;
  className?: string;
  /** Only for plain <a> links (downloads, external), e.g. to open the CV menu. */
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  /** Extra attributes for the link, e.g. aria-expanded. */
  linkProps?: React.AnchorHTMLAttributes<HTMLAnchorElement>;
};

function isExternal(href: unknown): boolean {
  return typeof href === "string" && /^https?:\/\//.test(href);
}

export function PillLink({
  href,
  children,
  variant = "primary",
  size = "large",
  download,
  track,
  className,
  onClick,
  linkProps,
}: PillLinkProps) {
  const classes = [styles.pill, styles[variant], styles[size], className].filter(Boolean).join(" ");

  if (typeof href === "string" && (download !== undefined || isExternal(href) || href.startsWith("/files/"))) {
    const external = isExternal(href);
    return (
      <a
        {...linkProps}
        href={href}
        className={classes}
        download={download}
        data-track={track}
        onClick={onClick}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href as PageHref} className={classes} data-track={track}>
      {children}
    </Link>
  );
}
