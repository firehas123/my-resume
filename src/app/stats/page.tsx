import type { Metadata } from "next";
import { StatsDashboard } from "@/components/stats/StatsDashboard";
import { buildWorldMap } from "@/lib/stats/worldMap";

// Unlisted: not linked from the site (unless "showStatsLink" is true in
// profile.json), not in the sitemap, and search engines are asked not to index it.
export const metadata: Metadata = {
  title: "Site stats",
  robots: { index: false, follow: false },
};

export default function StatsPage() {
  // The map shapes are computed here, on the server at build time, so no
  // mapping library is sent to the browser. The numbers load client-side.
  return <StatsDashboard map={buildWorldMap()} />;
}
