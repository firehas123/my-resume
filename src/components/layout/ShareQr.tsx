"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { QrCode } from "@/components/ui/QrCode";
import { CopyIcon, QrIcon, ShareIcon } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import type { QrShape } from "@/lib/qr";
import styles from "./ShareQr.module.css";

type ShareQrProps = {
  shape: QrShape;
  url: string;
  displayUrl: string;
  name: string;
  title: string;
};

/**
 * The QR button in the header. It opens an overlay with the site's QR code
 * (to hold up to someone), the phone's own share sheet where the browser has
 * one (Web Share API), otherwise "Copy link", and a link to the full /qr page.
 *
 * The overlay is a native <dialog> opened with showModal(): the browser keeps
 * the keyboard focus inside it and closes it with Escape. A click on the dark
 * area around the card closes it too.
 */
export function ShareQr({ shape, url, displayUrl, name, title }: ShareQrProps) {
  const t = useTranslations("qr");
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // Known only in the browser, so it starts false (same HTML on server and client).
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Reading a browser feature once after the first render; the server cannot know it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanShare(typeof navigator.share === "function");
  }, []);

  function open() {
    setCopied(false);
    dialog.current?.showModal();
  }

  function close() {
    dialog.current?.close();
  }

  async function share() {
    try {
      await navigator.share({ title: name, url });
    } catch (error) {
      // Closing the share sheet is not an error; anything else falls back to copying.
      if ((error as DOMException).name !== "AbortError") await copy();
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // No clipboard access (old browser or not allowed): the address is shown in the card anyway.
    }
  }

  return (
    <>
      <button type="button" className={styles.trigger} onClick={open} aria-label={t("open")} aria-haspopup="dialog">
        <QrIcon />
      </button>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby={titleId}
        // A click on the backdrop lands on the <dialog> itself, not on the card inside.
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className={styles.card}>
          <div className={styles.head}>
            <div>
              <p id={titleId} className={styles.name}>
                {name}
              </p>
              <p className={styles.title}>{title}</p>
            </div>
            <button type="button" className={styles.close} onClick={close} aria-label={t("close")}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <QrCode shape={shape} label={t("imageAlt", { url: displayUrl })} />
          <p className={styles.scan}>{t("scan")}</p>
          <p className={styles.url} dir="ltr">
            {displayUrl}
          </p>
          <div className={styles.actions}>
            {canShare ? (
              <button type="button" className={styles.primary} onClick={share}>
                <ShareIcon size={18} />
                {t("share")}
              </button>
            ) : (
              <button type="button" className={styles.primary} onClick={copy}>
                <CopyIcon size={18} />
                {t("copy")}
              </button>
            )}
            <Link href="/qr" className={styles.secondary} onClick={close}>
              {t("fullScreen")}
            </Link>
          </div>
          {/* Read out by screen readers when the link has been copied. */}
          <p className={styles.status} role="status">
            {copied ? t("copied") : ""}
          </p>
        </div>
      </dialog>
    </>
  );
}
