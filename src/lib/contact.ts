// How the contact form sends messages, decided on the server from the
// environment (Vercel → Settings → Environment Variables):
//
//   "server"     All four of these are set:
//                  NEXT_PUBLIC_HCAPTCHA_SITEKEY  my own hCaptcha site key (public)
//                  HCAPTCHA_SECRET               its secret key
//                  RESEND_API_KEY                Resend, which delivers the email
//                  CONTACT_TO_EMAIL              where messages go (my inbox)
//                The form posts to /api/contact, which checks the hCaptcha
//                answer with hCaptcha before anything is sent. Nothing can
//                skip the check, and the page holds no key that could be
//                used to send mail directly.
//
//   "web3forms"  Otherwise (the default): the browser posts straight to
//                Web3Forms with the public access key, using Web3Forms'
//                shared hCaptcha site key.
//
// Only this file reads these variables; the secret ones never reach the browser.

import { profileFor } from "./profile";

/** Web3Forms' shared hCaptcha site key for free plans. */
const WEB3FORMS_HCAPTCHA_SITEKEY = "50b2fe65-b00b-4b9e-ad62-3ba471098be2";

export type ContactSetup =
  | { mode: "server"; sitekey: string }
  | { mode: "web3forms"; sitekey: string; accessKey: string };

const env = (name: string) => process.env[name]?.trim() || "";

export function contactSetup(): ContactSetup {
  const sitekey = env("NEXT_PUBLIC_HCAPTCHA_SITEKEY");
  if (sitekey && env("HCAPTCHA_SECRET") && env("RESEND_API_KEY") && env("CONTACT_TO_EMAIL")) {
    return { mode: "server", sitekey };
  }
  return {
    mode: "web3forms",
    sitekey: WEB3FORMS_HCAPTCHA_SITEKEY,
    // NEXT_PUBLIC_WEB3FORMS_KEY overrides the key in profile.json.
    accessKey: env("NEXT_PUBLIC_WEB3FORMS_KEY") || profileFor("en").contactAccessKey,
  };
}

/** Server-only settings for /api/contact (null unless the server mode is configured). */
export function contactServerSettings() {
  if (contactSetup().mode !== "server") return null;
  return {
    sitekey: env("NEXT_PUBLIC_HCAPTCHA_SITEKEY"),
    secret: env("HCAPTCHA_SECRET"),
    resendKey: env("RESEND_API_KEY"),
    to: env("CONTACT_TO_EMAIL"),
    // Resend's test sender works without a domain of my own, but only
    // delivers to the address the Resend account was created with.
    from: env("CONTACT_FROM_EMAIL") || "Resume website <onboarding@resend.dev>",
  };
}
