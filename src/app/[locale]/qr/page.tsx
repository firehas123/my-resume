import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageTransition } from "@/components/motion/PageTransition";
import { QrCode } from "@/components/ui/QrCode";
import { DownloadIcon } from "@/components/ui/icons";
import { profileFor } from "@/lib/profile";
import { QR_DISPLAY_URL, QR_FILES, qrShape } from "@/lib/qr";
import { alternates } from "@/lib/seo";
import styles from "./page.module.css";

// /<language>/qr: a big QR code of the site to hold up at a job fair, with
// my name and title above it. Bookmarkable and fit for the phone's home
// screen (short title). It is left out of the sitemap: it is a tool for me,
// not a page people search for.

export async function generateMetadata({ params }: PageProps<"/[locale]/qr">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "qr" });
  const profile = profileFor(locale);
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { name: profile.name }),
    alternates: alternates("/qr", locale),
    // The name under the icon when the page is added to an iPhone home screen.
    appleWebApp: { title: profile.shortName },
  };
}

export default async function QrPage({ params }: PageProps<"/[locale]/qr">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "qr" });
  const profile = profileFor(locale);

  return (
    <PageTransition>
      <section className={styles.page} aria-labelledby="qr-name">
        <div className={`container ${styles.inner}`}>
          <div className={styles.heading}>
            <h1 id="qr-name" className={styles.name}>
              {profile.name}
            </h1>
            <p className={styles.title}>{profile.title}</p>
          </div>
          <QrCode shape={qrShape()} label={t("imageAlt", { url: QR_DISPLAY_URL })} className={styles.qr} />
          <p className={styles.scan}>{t("scan")}</p>
          <p className={styles.url} dir="ltr">
            {QR_DISPLAY_URL}
          </p>
          <p className={styles.downloads}>
            <DownloadIcon size={16} />
            <span>{t("download")}</span>
            <a href={QR_FILES.svg} download="resume-qr.svg" className="u-link">
              SVG
            </a>
            <a href={QR_FILES.png} download="resume-qr.png" className="u-link">
              PNG
            </a>
          </p>
        </div>
      </section>
    </PageTransition>
  );
}
