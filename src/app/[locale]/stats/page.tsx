import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { StatsDashboard } from "@/components/stats/StatsDashboard";
import { LANGUAGES } from "@/i18n/config";
import { buildWorldMap } from "@/lib/stats/worldMap";
import { PageTransition } from "@/components/motion/PageTransition";

// Unlisted: not linked from the site (unless "showStatsLink" is true in
// profile.json), not in the sitemap, and search engines are asked not to index it.
export async function generateMetadata({ params }: PageProps<"/[locale]/stats">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "stats" });
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

export default function StatsPage() {
  // The map shapes are computed here, on the server at build time, so no
  // mapping library is sent to the browser. The numbers load client-side.
  return (
    <PageTransition>
      <StatsDashboard map={buildWorldMap()} languages={LANGUAGES} />
    </PageTransition>
  );
}
