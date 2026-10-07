// POST /api/visit: counts one page view (and the visit, on a tab's first
// page) or one event, sent by VisitTracker in the browser.
//
// Checks, in order: production only, Do Not Track / Global Privacy Control,
// bots, own site only, rate limit, size and every value against fixed lists.
// Ignored requests get "204 No Content" too, so the response reveals nothing.
// Nothing about the visitor is stored or logged: only the country (from
// Vercel's geolocation header) goes into the aggregated counters.

import { isLocale } from "@/i18n/config";
import { statsEnabled } from "@/lib/env";
import { DEVICES, EVENTS, THEMES, isAllowedPath, isOneOf, normalizeCountry, normalizeReferrer } from "@/lib/stats/config";
import { isBot, isSameOrigin, optedOut, rateLimited } from "@/lib/stats/guard";
import { recordEvent, recordView } from "@/lib/stats/record";
import { getRedis } from "@/lib/stats/redis";

const MAX_BODY_BYTES = 1024;
const noContent = () => new Response(null, { status: 204 });

export async function POST(request: Request) {
  const headers = request.headers;
  if (!statsEnabled) return noContent();
  if (optedOut(headers)) return noContent();
  if (isBot(headers.get("user-agent"))) return noContent();
  if (!isSameOrigin(headers)) return new Response(null, { status: 403 });
  if (rateLimited()) return new Response(null, { status: 429 });

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return new Response(null, { status: 413 });
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    body = parsed as Record<string, unknown>;
  } catch {
    return new Response(null, { status: 400 });
  }

  const redis = getRedis();
  if (!redis) return noContent(); // database not connected yet: count nothing

  try {
    if (body.kind === "event") {
      if (!isOneOf(EVENTS, body.name)) return new Response(null, { status: 400 });
      await recordEvent(redis, body.name);
      return noContent();
    }

    if (body.kind === "view") {
      if (!isAllowedPath(body.path) || typeof body.newVisit !== "boolean") return new Response(null, { status: 400 });
      // The site language: one of the configured codes, or none.
      if (body.lang !== undefined && body.lang !== null && !isLocale(body.lang)) return new Response(null, { status: 400 });
      const lang = isLocale(body.lang) ? body.lang : undefined;
      const country = normalizeCountry(headers.get("x-vercel-ip-country"));
      if (body.newVisit) {
        const referrer = normalizeReferrer(body.referrer);
        if (!isOneOf(DEVICES, body.device) || !isOneOf(THEMES, body.theme) || referrer === null) {
          return new Response(null, { status: 400 });
        }
        await recordView(redis, { country, path: body.path, lang, newVisit: true, device: body.device, theme: body.theme, referrer });
      } else {
        await recordView(redis, { country, path: body.path, lang, newVisit: false });
      }
      return noContent();
    }

    return new Response(null, { status: 400 });
  } catch {
    // A database hiccup must never break the visitor's page.
    return noContent();
  }
}
