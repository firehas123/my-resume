// GET /api/cron/keepalive: called once a day by a Vercel Cron Job (vercel.json)
// so the free Redis database never counts as inactive. Writes only its own
// key, keepalive:last (ISO time, expires after 7 days); visitor statistics
// are never touched. Requires Authorization: Bearer ${CRON_SECRET}, which
// Vercel sends automatically when CRON_SECRET is set on the project.

import { timingSafeEqual } from "node:crypto";
import { getRedis } from "@/lib/stats/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "keepalive:last";
const TTL_SECONDS = 7 * 24 * 60 * 60;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
  if (!authorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401, headers });
  }
  const db = getRedis();
  if (!db) {
    return Response.json({ ok: false, error: "Database not connected" }, { status: 500, headers });
  }
  try {
    await db.set(KEY, new Date().toISOString(), { ex: TTL_SECONDS });
    const at = await db.get<string>(KEY);
    if (!at) throw new Error("read-back failed");
    return Response.json({ ok: true, at }, { headers });
  } catch {
    return Response.json({ ok: false, error: "Database write failed" }, { status: 500, headers });
  }
}
