"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { GlobeIcon } from "@/components/ui/icons";
import { Link, usePathname } from "@/i18n/navigation";
import styles from "./Header.module.css";

type Language = { code: string; name: string };

/**
 * The language menu in the header: a button with a globe and the current
 * language code, opening a list of every language in its own name. Picking
 * one opens the same page in that language (keeping the selected project tab
 * and the section you were at) and remembers the choice in a cookie.
 *
 * Keyboard: Enter/Space opens it, arrow keys move through the list, Escape
 * closes it and returns to the button.
 */
export function LanguageSwitcher({ languages }: { languages: Language[] }) {
  const t = useTranslations("language");
  const locale = useLocale();
  const pathname = usePathname(); // the page without its language, e.g. "/projects/[slug]"
  const params = useParams();
  const [open, setOpen] = useState(false);
  // The address parts that are not part of the page itself (?tab=..., #section).
  const [extras, setExtras] = useState<{ query: Record<string, string>; hash: string }>({ query: {}, hash: "" });
  const menuId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const current = languages.find((l) => l.code === locale) ?? languages[0];

  function items(): HTMLAnchorElement[] {
    return [...(wrap.current?.querySelectorAll<HTMLAnchorElement>("[data-language]") ?? [])];
  }

  function show() {
    setExtras({
      query: Object.fromEntries(new URLSearchParams(window.location.search)),
      hash: window.location.hash.slice(1),
    });
    setOpen(true);
  }

  // When the menu opens, focus the current language.
  useEffect(() => {
    if (!open) return;
    items().find((a) => a.getAttribute("aria-current"))?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      button.current?.focus();
      return;
    }
    if (!open || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const list = items();
    const index = list.indexOf(document.activeElement as HTMLAnchorElement);
    const next =
      event.key === "Home" ? 0 : event.key === "End" ? list.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + list.length) % list.length;
    list[next]?.focus();
  }

  // Leaving the menu with Tab closes it.
  function onBlur(event: React.FocusEvent) {
    if (!wrap.current?.contains(event.relatedTarget as Node)) setOpen(false);
  }

  return (
    <div ref={wrap} className={styles.language} onKeyDown={onKeyDown} onBlur={onBlur}>
      <button
        ref={button}
        type="button"
        className={styles.languageButton}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t("button", { name: current.name })}
        onClick={() => (open ? setOpen(false) : show())}
      >
        <GlobeIcon size={18} />
        <span className={styles.languageCode} aria-hidden="true">
          {current.code}
        </span>
      </button>
      <ul id={menuId} className={styles.languageMenu} aria-label={t("menu")} hidden={!open}>
        {languages.map((language) => (
          <li key={language.code}>
            <Link
              // The same page in the other language. `params` carries e.g. the project slug.
              href={{ pathname, params, query: extras.query, hash: extras.hash } as React.ComponentProps<typeof Link>["href"]}
              locale={language.code}
              lang={language.code}
              hrefLang={language.code}
              className={styles.languageItem}
              aria-current={language.code === locale ? "true" : undefined}
              data-language=""
              onClick={() => setOpen(false)}
            >
              <span>{language.name}</span>
              <span className={styles.languageItemCode} aria-hidden="true">
                {language.code}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
