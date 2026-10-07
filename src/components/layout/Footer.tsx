import { getLocale, getTranslations } from "next-intl/server";
import { languageInfo } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { getProfile } from "@/lib/profile";
import styles from "./Footer.module.css";

// The footer is rendered when the site is built, so this is the date of the
// latest deploy: the date the site was last updated.
const updated = new Date();

export async function Footer() {
  const t = await getTranslations("footer");
  const locale = await getLocale();
  const language = languageInfo(locale);
  const profile = await getProfile();
  const updatedLabel = new Intl.DateTimeFormat(language.intl, { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" }).format(updated);
  // The legal pages exist in English and German; other languages link to English.
  const legalLocale = language.hasLegal ? locale : "en";

  return (
    // band-dark: the footer stays black in both themes.
    <footer className={`band-dark ${styles.footer}`}>
      <div className={`container ${styles.inner}`}>
        <p>{profile.name}</p>
        <p className={styles.note}>
          {t.rich("updated", { date: () => <time dateTime={updated.toISOString().slice(0, 10)}>{updatedLabel}</time> })}
        </p>
        <nav aria-label={t("legalNav")}>
          <ul className={styles.legal}>
            <li>
              {/* A plain link to the top of the page content: works without JavaScript. */}
              <a href="#main" className={`u-link ${styles.backToTop}`}>
                {t("backToTop")}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 19V5" />
                  <path d="M6 11l6-6 6 6" />
                </svg>
              </a>
            </li>
            <li>
              <Link href="/legal-notice" locale={legalLocale} hrefLang={legalLocale} className="u-link">
                {t("legalNotice")}
              </Link>
            </li>
            <li>
              <Link href="/privacy" locale={legalLocale} hrefLang={legalLocale} className="u-link">
                {t("privacy")}
              </Link>
            </li>
            {/* The stats page is unlisted unless switched on in profile.json. */}
            {profile.showStatsLink && (
              <li>
                <Link href="/stats" className="u-link">
                  {t("stats")}
                </Link>
              </li>
            )}
          </ul>
        </nav>
        {/* Honest notes for the languages I do not work in. */}
        {(!language.primary || !language.hasLegal) && (
          <div className={styles.notes}>
            {!language.primary && <p>{t("translated")}</p>}
            {!language.hasLegal && <p>{t("legalInEnglish")}</p>}
          </div>
        )}
      </div>
    </footer>
  );
}
