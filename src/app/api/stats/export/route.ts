// GET /api/stats/export?format=json|csv: every stored statistic, for backups.
//   json: the complete data (can be restored with `npm run stats:restore`)
//   csv:  one row per day and country (date,country,visits,pageviews)

import { exportAll, exportToCsv } from "../../../../../scripts/lib/stats-store.mjs";
import { getRedis } from "@/lib/stats/redis";

export async function GET(request: Request) {
  const format = new URL(request.url).searchParams.get("format") ?? "json";
  if (format !== "json" && format !== "csv") return Response.json({ error: "Unknown format" }, { status: 400 });
  const redis = getRedis();
  if (!redis) return Response.json({ error: "The statistics database is not connected yet." }, { status: 503 });

  const data = await exportAll(redis);
  const date = data.exportedAt.slice(0, 10);
  const common = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
  if (format === "csv") {
    return new Response(exportToCsv(data), {
      headers: { ...common, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="site-stats-${date}.csv"` },
    });
  }
  return new Response(JSON.stringify(data, null, 2), {
    headers: { ...common, "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="site-stats-${date}.json"` },
  });
}
