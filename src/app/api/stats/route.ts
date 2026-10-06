// GET /api/stats?range=7d: the aggregated statistics for the stats page.
// Only aggregated numbers exist in the database, so nothing personal can
// ever be returned. When the database is not connected yet, says so
// instead of showing anything made up.

import { getRedis } from "@/lib/stats/redis";
import { RANGES, getSummary, type Range } from "@/lib/stats/summary";

export async function GET(request: Request) {
  const range = new URL(request.url).searchParams.get("range") ?? "30d";
  if (!(RANGES as readonly string[]).includes(range)) {
    return Response.json({ error: "Unknown range" }, { status: 400 });
  }
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
  const redis = getRedis();
  if (!redis) return Response.json({ connected: false }, { headers });
  try {
    return Response.json(await getSummary(redis, range as Range), { headers });
  } catch {
    return Response.json({ connected: true, error: "The statistics could not be read right now." }, { status: 503, headers });
  }
}
