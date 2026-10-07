"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useRef, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTheme } from "@/hooks/useTheme";
import styles from "./ContactForm.module.css";

// The contact form posts straight from the browser to Web3Forms
// (https://web3forms.com), which emails the message to the site owner. There
// is no server code here, and the owner's email address never appears in the
// page: Web3Forms knows it from the public access key.

const WEB3FORMS_URL = "https://api.web3forms.com/submit";
const SUBJECT = "New message from your website";
// Web3Forms' shared hCaptcha site key for free plans: no account with
// hCaptcha needed. Web3Forms checks the answer ("h-captcha-response") once
// hCaptcha is chosen under "Block spam" in the Web3Forms dashboard.
const HCAPTCHA_SITEKEY = "50b2fe65-b00b-4b9e-ad62-3ba471098be2";

type Fields = { name: string; email: string; message: string };
type Errors = Partial<Record<keyof Fields | "captcha", string>>;
type Status = "idle" | "sending" | "sent" | "failed";

const LIMITS = { name: 100, message: 5000 };
// Deliberately simple: something@something.something. Web3Forms and the
// reply are the real check.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY: Fields = { name: "", email: "", message: "" };

function validate(fields: Fields): Errors {
  const errors: Errors = {};
  if (!fields.name.trim()) errors.name = "Please enter your name.";
  else if (fields.name.length > LIMITS.name) errors.name = `Please keep your name under ${LIMITS.name} characters.`;

  if (!fields.email.trim()) errors.email = "Please enter your email address, so I can reply.";
  else if (!EMAIL_PATTERN.test(fields.email.trim())) errors.email = "This email address does not look complete.";

  if (fields.message.trim().length < 10) errors.message = "Please write a message of at least 10 characters.";
  else if (fields.message.length > LIMITS.message)
    errors.message = `Please keep your message under ${LIMITS.message} characters.`;
  return errors;
}

type ContactFormProps = {
  /** Web3Forms public access key (not a secret). */
  accessKey: string;
  /** Fallback when sending fails. */
  linkedinUrl?: string;
};

export function ContactForm({ accessKey, linkedinUrl }: ContactFormProps) {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const honeypot = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { theme } = useTheme();
  // The normal widget is 303px wide; narrow phones get the compact one.
  const compact = useMediaQuery("(max-width: 400px)");

  function update(field: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    // Clear a field's error as soon as the visitor starts fixing it.
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // never reload the page
    if (status === "sending") return;

    const found: Errors = validate(fields);
    if (!captchaToken) found.captcha = "Please complete the check above, so I know you are not a bot.";
    setErrors(found);
    const firstInvalid = (Object.keys(EMPTY) as (keyof Fields)[]).find((key) => found[key]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    if (found.captcha) return;

    setStatus("sending");
    try {
      const response = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
          subject: SUBJECT,
          from_name: "Resume website",
          name: fields.name.trim(),
          email: fields.email.trim(),
          // Replying in the inbox answers the visitor directly.
          replyto: fields.email.trim(),
          message: fields.message.trim(),
          // Honeypot: always empty for people; Web3Forms drops the
          // submission when a bot fills it in.
          botcheck: honeypot.current?.checked ?? false,
          // The visitor's answer to the hCaptcha check.
          "h-captcha-response": captchaToken,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success !== true) throw new Error(result.message ?? `Status ${response.status}`);
      setStatus("sent");
      setFields(EMPTY);
    } catch {
      // Keep everything the visitor typed.
      setStatus("failed");
    } finally {
      // An answer is valid for one submission only: ask again next time.
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    }
  }

  if (status === "sent") {
    return (
      <div className={styles.success} role="status">
        <svg className={styles.check} viewBox="0 0 52 52" aria-hidden="true">
          <circle className={styles.checkCircle} cx="26" cy="26" r="24" />
          <path className={styles.checkMark} d="M15 27l7 7 15-16" />
        </svg>
        <p className={styles.noticeTitle}>Thank you, your message is on its way.</p>
        <p>I will reply to the email address you gave.</p>
        <button type="button" className={styles.textButton} onClick={() => setStatus("idle")}>
          Send another
        </button>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={sending}>
      <Field id="name" label="Name" error={errors.name}>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={LIMITS.name + 20}
          value={fields.name}
          onChange={(e) => update("name", e.target.value)}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          required
        />
      </Field>

      <Field id="email" label="Email" error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={fields.email}
          onChange={(e) => update("email", e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          required
        />
      </Field>

      <Field id="message" label="Message" error={errors.message}>
        <textarea
          id="message"
          name="message"
          rows={7}
          value={fields.message}
          onChange={(e) => update("message", e.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "message-error" : undefined}
          required
        />
      </Field>

      {/* Honeypot (Web3Forms "botcheck"): hidden from people and screen
          readers; bots that tick every box give themselves away. */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="botcheck">Leave this box unticked</label>
        <input ref={honeypot} id="botcheck" name="botcheck" type="checkbox" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={styles.captcha}>
        {/* key: the widget only picks up a new theme or size when recreated. */}
        <HCaptcha
          key={`${theme}-${compact}`}
          size={compact ? "compact" : "normal"}
          ref={captchaRef}
          sitekey={HCAPTCHA_SITEKEY}
          reCaptchaCompat={false}
          theme={theme}
          onVerify={(token) => {
            setCaptchaToken(token);
            setErrors((current) => ({ ...current, captcha: undefined }));
          }}
          onExpire={() => setCaptchaToken(null)}
          onError={() => setCaptchaToken(null)}
        />
        {errors.captcha && (
          <p className={styles.fieldError} role="alert">
            {errors.captcha}
          </p>
        )}
      </div>

      {status === "failed" && (
        <div className={`${styles.notice} ${styles.error}`} role="alert">
          <p className={styles.noticeTitle}>Sorry, the message could not be sent.</p>
          <p>
            Your text is still here, so you can try again.
            {linkedinUrl && (
              <>
                {" "}
                Or reach me on{" "}
                <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
                .
              </>
            )}
          </p>
        </div>
      )}

      <button type="submit" className={styles.submit} disabled={sending}>
        {sending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className={styles.fieldError}>
          {error}
        </p>
      )}
    </div>
  );
}
