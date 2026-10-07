import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/layout/LegalPage";
import { LEGAL_LANGUAGES, languageInfo } from "@/i18n/config";
import { redirect } from "@/i18n/navigation";
import { legalHtml } from "@/lib/legal";
import { alternates } from "@/lib/seo";
import { PageTransition } from "@/components/motion/PageTransition";

// English: "Privacy Policy" at /en/privacy; German: "Datenschutzerklärung"
// at /de/datenschutz. Other languages lead to the English page (src/proxy.ts).
export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  return { title: t("privacyTitle"), alternates: alternates("/privacy", locale, LEGAL_LANGUAGES) };
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  if (!languageInfo(locale).hasLegal) redirect({ href: "/privacy", locale: "en" });
  const t = await getTranslations("legal");
  return (
    <PageTransition>
      <LegalPage title={t("privacyTitle")} html={await legalHtml("privacy", locale)} />
    </PageTransition>
  );
}
