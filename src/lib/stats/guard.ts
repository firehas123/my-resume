// Request checks for the visit counter: own site only, no bots, respect
// Do Not Track / Global Privacy Control, and a simple rate limit.
// None of these store anything about the visitor.

const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|skype|headless|lighthouse|pagespeed|pingdom|uptime|monitor|curl|wget|python|httpclient|okhttp|go-http|java\/|axios|node-fetch|undici|postman|insomnia/i;

/** Bots and crawlers, recognised by their user agent (read, never stored). */
export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

/** Do Not Track or Global Privacy Control sent by the browser. */
export function optedOut(headers: Headers): boolean {
  return headers.get("dnt") === "1" || headers.get("sec-gpc") === "1";
}

/** Only requests made by pages of this same site are accepted. */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!origin || !host) return false;
  try {
    if (new URL(origin).host !== host) return false;
  } catch {
    return false;
  }
  const site = headers.get("sec-fetch-site");
  return site === null || site === "same-origin";
}

// Simple rate limit: at most LIMIT requests per WINDOW per server instance,
// counted in memory without looking at who sent them (no IPs involved).
// Enough to stop floods; normal traffic for a personal site is far below.
const WINDOW_MS = 10_000;
const LIMIT = 60;
let windowStart = 0;
let count = 0;

export function rateLimited(now = Date.now()): boolean {
  if (now - windowStart > WINDOW_MS) {
    windowStart = now;
    count = 0;
  }
  count += 1;
  return count > LIMIT;
}
