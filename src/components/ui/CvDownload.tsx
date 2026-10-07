"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { Magnetic } from "@/components/motion/Magnetic";
import type { CvFile } from "@/lib/cv";
import { DownloadIcon } from "./icons";
import { PillLink } from "./PillLink";
import styles from "./CvDownload.module.css";

type CvDownloadProps = {
  /** The CV in the language of the page. */
  current: CvFile;
  /** The CV in every other language. */
  others: CvFile[];
  /** Europass CVs that exist (public/files/europass-cv-<code>.pdf). */
  europass: CvFile[];
  size?: "small" | "large";
  /** Show the download arrow (the hero button). */
  icon?: boolean;
  /** The hero button leans toward the cursor; the menu stays put. */
  magnetic?: boolean;
  /** Which edge the menu lines up with (the header button sits at the end of the row). */
  align?: "start" | "end";
  /** On narrow phones, show the short label ("Lebenslauf" instead of "Lebenslauf herunterladen"). */
  shortOnPhones?: boolean;
};

/**
 * "Download CV": downloads the CV in the language of the page, and opens a
 * small menu offering it in every other language (and Europass, if present).
 * The menu closes with Escape, a click elsewhere or its close button.
 */
export function CvDownload({ current, others, europass, size = "large", icon, magnetic, align = "start", shortOnPhones }: CvDownloadProps) {
  const t = useTranslations("cv");
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      wrap.current?.querySelector<HTMLElement>("[data-cv-main]")?.focus();
    };
    const onPointer = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const button = (
    <PillLink
      href={current.href}
      download={current.fileName}
      track={current.track}
      size={size}
      onClick={() => setOpen(true)}
      linkProps={{ "aria-controls": menuId, "aria-expanded": open, "data-cv-main": "", hrefLang: current.code } as React.AnchorHTMLAttributes<HTMLAnchorElement>}
    >
      {icon && <DownloadIcon nudge />}
      {shortOnPhones ? (
        // Both labels are in the page; CSS shows one (display: none also hides
        // the other from screen readers).
        <>
          <span className={styles.longLabel}>{t("download")}</span>
          <span className={styles.shortLabel}>{t("downloadShort")}</span>
        </>
      ) : (
        t("download")
      )}
    </PillLink>
  );

  return (
    <span ref={wrap} className={styles.wrap}>
      {magnetic ? <Magnetic>{button}</Magnetic> : button}
      {/* Always in the HTML (hidden until opened), so the links work without JavaScript too. */}
      <div id={menuId} className={styles.menu} data-align={align} hidden={!open}>
        <div className={styles.menuHeader}>
          <p className={styles.menuTitle}>{t("otherLanguages")}</p>
          <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label={t("close")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <ul className={styles.list} aria-label={t("menu")}>
          {others.map((file) => (
            <li key={file.code}>
              <a href={file.href} download={file.fileName} hrefLang={file.code} lang={file.code} data-track={file.track} onClick={() => setOpen(false)}>
                {file.name}
              </a>
            </li>
          ))}
          {europass.map((file) => (
            <li key={`europass-${file.code}`}>
              <a href={file.href} download={file.fileName} hrefLang={file.code} data-track={file.track} onClick={() => setOpen(false)}>
                {t("europassIn", { language: file.name })}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </span>
  );
}
