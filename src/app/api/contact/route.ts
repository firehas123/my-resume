// POST /api/contact: the contact form's server route (only used when the
// server mode is configured, see src/lib/contact.ts).
//
// It checks the visitor's hCaptcha answer with hCaptcha itself, then sends
// the message to my inbox through Resend. The rules (validation, honeypot,
// daily limit, the order of the checks) live in scripts/lib/contact.mjs and
// are tested there; this file only connects them to hCaptcha, Redis and Resend.
// Nothing about the sender is stored; the daily limit is one shared counter.

import { handleContact, MAX_MESSAGES_PER_DAY } from "../../../../scripts/lib/contact.mjs";
import { contactServerSettings } from "@/lib/contact";
import { getRedis } from "@/lib/stats/redis";

const MAX_BODY_BYTES = 20_000;

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const settings = contactServerSettings();
  if (!settings) return Response.json({ success: false, error: "off" }, { status: 404, headers });

  // Only this site's own pages may post here.
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== new URL(request.url).host) {
    return Response.json({ success: false, error: "origin" }, { status: 403, headers });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return Response.json({ success: false, error: "invalid" }, { status: 413, headers });
  let input: unknown;
  try {
    input = JSON.parse(raw);
  } catch {
    return Response.json({ success: false, error: "invalid" }, { status: 400, headers });
  }

  const result = await handleContact(input, {
    async verifyCaptcha(token: string) {
      try {
        const response = await fetch("https://api.hcaptcha.com/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          // sitekey: an answer solved for another site key is not accepted.
          body: new URLSearchParams({ secret: settings.secret, response: token, sitekey: settings.sitekey }),
        });
        const json = (await response.json()) as { success?: boolean };
        return json.success === true;
      } catch {
        return false;
      }
    },
    async takeDailySlot() {
      const redis = getRedis();
      if (!redis) return true; // without the database there is no limit
      const key = `contact:sent:${new Date().toISOString().slice(0, 10)}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, 60 * 60 * 48);
      return count <= MAX_MESSAGES_PER_DAY;
    },
    async send(mail: { subject: string; text: string; replyTo: string }) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${settings.resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: settings.from, to: settings.to, subject: mail.subject, text: mail.text, reply_to: mail.replyTo }),
      });
      if (!response.ok) throw new Error(`Resend answered ${response.status}`);
    },
  });
  return Response.json(result.body, { status: result.status, headers });
}
