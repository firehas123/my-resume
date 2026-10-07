import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/layout/LegalPage";
import { LEGAL_LANGUAGES, languageInfo } from "@/i18n/config";
import { redirect } from "@/i18n/navigation";
import { legalHtml } from "@/lib/legal";
import { alternates } from "@/lib/seo";
import { PageTransition } from "@/components/motion/PageTransition";

// English: "Legal Notice (Impressum)" at /en/legal-notice; German: "Impressum"
// at /de/impressum. Other languages lead to the English page (src/proxy.ts).
export async function generateMetadata({ params }: PageProps<"/[locale]/legal-notice">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return { title: t("legalNoticeTitle"), alternates: alternates("/legal-notice", locale, LEGAL_LANGUAGES) };
}

export default async function LegalNoticePage({ params }: PageProps<"/[locale]/legal-notice">) {
  const { locale } = await params;
  if (!languageInfo(locale).hasLegal) redirect({ href: "/legal-notice", locale: "en" });
  const t = await getTranslations("legal");
  return (
    <PageTransition>
      <LegalPage title={t("legalNoticeTitle")} html={await legalHtml("legal-notice", locale)} />
    </PageTransition>
  );
}
