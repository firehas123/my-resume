// The contact form's rules, shared by the form in the browser, the server
// route /api/contact and the tests (scripts/contact.test.mjs). Plain
// JavaScript and pure functions, like the other helpers in scripts/lib.

export const LIMITS = { name: 100, message: 5000, messageMin: 10 };
// Deliberately simple: something@something.something. The reply is the real check.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// The email is for me, so it stays in English; it names the language the
// visitor used, e.g. "New message from your website (Deutsch, de)".
export const SUBJECT = "New message from your website";
// At most this many messages a day reach my inbox through the server route
// (one counter for everyone; nothing about the sender is stored).
export const MAX_MESSAGES_PER_DAY = 30;

/**
 * Checks the three fields. Returns a problem code per field that is not
 * right; the form turns the codes into sentences in the page's language.
 *   name:    "missing" | "long"
 *   email:   "missing" | "invalid"
 *   message: "short" | "long"
 */
export function validateContact({ name = "", email = "", message = "" }) {
  const problems = {};
  if (!name.trim()) problems.name = "missing";
  else if (name.length > LIMITS.name) problems.name = "long";

  if (!email.trim()) problems.email = "missing";
  else if (!EMAIL_PATTERN.test(email.trim())) problems.email = "invalid";

  if (message.trim().length < LIMITS.messageMin) problems.message = "short";
  else if (message.length > LIMITS.message) problems.message = "long";
  return problems;
}

/** The plain-text email I receive. */
export function contactEmail({ name, email, message, language }) {
  return {
    subject: `${SUBJECT}${language ? ` (${language})` : ""}`,
    text: [`Name: ${name}`, `Email: ${email}`, language ? `Language: ${language}` : null, "", message].filter((line) => line !== null).join("\n"),
  };
}

/**
 * Handles one submission to /api/contact. Everything that talks to the
 * outside is passed in, so this can be tested without network access:
 *   verifyCaptcha(token) -> Promise<boolean>   asks hCaptcha whether the answer is real
 *   takeDailySlot()      -> Promise<boolean>   false once today's limit is reached
 *   send(mail)           -> Promise<void>      delivers the email (throws on failure)
 * Returns { status, body } for the HTTP response. The order matters: the
 * captcha is checked before anything is counted or sent.
 */
export async function handleContact(input, { verifyCaptcha, takeDailySlot, send }) {
  const fields = {
    name: typeof input?.name === "string" ? input.name.trim() : "",
    email: typeof input?.email === "string" ? input.email.trim() : "",
    message: typeof input?.message === "string" ? input.message.trim() : "",
  };
  const language = typeof input?.language === "string" ? input.language.slice(0, 40) : "";

  if (Object.keys(validateContact(fields)).length > 0) return { status: 400, body: { success: false, error: "invalid" } };

  const token = typeof input?.captcha === "string" ? input.captcha : "";
  if (!token || !(await verifyCaptcha(token))) return { status: 400, body: { success: false, error: "captcha" } };

  // Honeypot: people never tick it. A bot that does gets a normal-looking
  // answer, but nothing is sent.
  if (input?.botcheck === true) return { status: 200, body: { success: true } };

  if (!(await takeDailySlot())) return { status: 429, body: { success: false, error: "limit" } };

  try {
    await send({ ...contactEmail({ ...fields, language }), replyTo: fields.email });
  } catch {
    return { status: 502, body: { success: false, error: "send" } };
  }
  return { status: 200, body: { success: true } };
}
