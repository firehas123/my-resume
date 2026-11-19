import { getLocale, getTranslations } from "next-intl/server";
import { CvDownload } from "@/components/ui/CvDownload";
import { Logo } from "@/components/ui/Logo";
import { LANGUAGES, languageInfo } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { cvFiles } from "@/lib/cv";
import { getProfile } from "@/lib/profile";
import { QR_DISPLAY_URL, QR_URL, qrShape } from "@/lib/qr";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { NavLinks } from "./NavLinks";
import { ScrollProgress } from "./ScrollProgress";
import { ShareQr } from "./ShareQr";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Header.module.css";

export async function Header() {
  const t = await getTranslations();
  const profile = await getProfile();
  const cv = await cvFiles(await getLocale());
  // Section links point at the home page, so they also work from other pages.
  const nav = [
    { section: "about", label: t("nav.about") },
    { section: "experience", label: t("nav.experience") },
    { section: "projects", label: t("nav.projects") },
    { section: "skills", label: t("nav.skills") },
    { page: "/contact" as const, label: t("nav.contact") },
  ];
  const languages = LANGUAGES.map((code) => ({ code, name: languageInfo(code).name }));

  return (
    // viewTransitionName: the header stays still during page transitions.
    <header className={styles.header} style={{ viewTransitionName: "site-header" }}>
      <div className={`container ${styles.bar}`}>
        <Link href={{ pathname: "/", hash: "top" }} className={styles.logo} data-header-logo="" aria-label={t("common.homeLink", { name: profile.shortName })}>
          <Logo height={26} />
        </Link>
        <nav aria-label={t("common.sectionsNav")} className={styles.nav}>
          <NavLinks items={nav} />
        </nav>
        <div className={styles.actions}>
          <LanguageSwitcher languages={languages} />
          <ThemeToggle />
          {/* QR code to hold up to someone, plus the phone's share sheet. */}
          <ShareQr shape={qrShape()} url={QR_URL} displayUrl={QR_DISPLAY_URL} name={profile.name} title={profile.title} />
          <CvDownload {...cv} size="small" align="end" shortOnPhones />
        </div>
      </div>
      <ScrollProgress />
    </header>
  );
}
