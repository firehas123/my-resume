"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { languageInfo } from "@/i18n/config";
import type { ContactSetup } from "@/lib/contact";
import { LIMITS, SUBJECT, validateContact } from "../../../scripts/lib/contact.mjs";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useTheme } from "@/hooks/useTheme";
import styles from "./ContactForm.module.css";

// The contact form. How it sends depends on the setup the page passes in
// (see src/lib/contact.ts):
//   - "server":    posts to this site's /api/contact, which checks the
//                  hCaptcha answer with hCaptcha and then emails me;
//   - "web3forms": posts straight from the browser to Web3Forms
//                  (https://web3forms.com), which emails me.
// Either way my email address never appears in the page. The field rules
// are shared with the server (scripts/lib/contact.mjs).

const WEB3FORMS_URL = "https://api.web3forms.com/submit";

type Fields = { name: string; email: string; message: string };
type Errors = Partial<Record<keyof Fields | "captcha", string>>;
type Translate = (key: string, values?: Record<string, number>) => string;
type Status = "idle" | "sending" | "sent" | "failed";

const EMPTY: Fields = { name: "", email: "", message: "" };
// Problem codes from validateContact() -> message keys in "form.errors".
const ERROR_KEYS: Record<string, string> = {
  "name.missing": "nameMissing",
  "name.long": "nameLong",
  "email.missing": "emailMissing",
  "email.invalid": "emailInvalid",
  "message.short": "messageShort",
  "message.long": "messageLong",
};

/** `t` is the "form.errors" translator, so the messages are in the page's language. */
function validate(fields: Fields, t: Translate): Errors {
  const problems = validateContact(fields) as Partial<Record<keyof Fields, string>>;
  const errors: Errors = {};
  for (const [field, code] of Object.entries(problems) as [keyof Fields, string][]) {
    errors[field] = t(ERROR_KEYS[`${field}.${code}`], { max: field === "name" ? LIMITS.name : LIMITS.message, min: LIMITS.messageMin });
  }
  return errors;
}

type ContactFormProps = {
  /** How messages are sent, and the hCaptcha site key to use. */
  setup: ContactSetup;
  /** Fallback when sending fails. */
  linkedinUrl?: string;
};

export function ContactForm({ setup, linkedinUrl }: ContactFormProps) {
  const t = useTranslations("form");
  const tErrors = useTranslations("form.errors");
  const locale = useLocale();
  const language = `${languageInfo(locale).name}, ${locale}`;
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

    const found: Errors = validate(fields, tErrors);
    if (!captchaToken) found.captcha = tErrors("captcha");
    setErrors(found);
    const firstInvalid = (Object.keys(EMPTY) as (keyof Fields)[]).find((key) => found[key]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }
    if (found.captcha) return;

    setStatus("sending");
    try {
      const botcheck = honeypot.current?.checked ?? false;
      const response =
        setup.mode === "server"
          ? await fetch("/api/contact", {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({ ...trimmed(fields), language, botcheck, captcha: captchaToken }),
            })
          : await fetch(WEB3FORMS_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({
                access_key: setup.accessKey,
                subject: `${SUBJECT} (${language})`,
                from_name: "Resume website",
                ...trimmed(fields),
                // Replying in the inbox answers the visitor directly.
                replyto: fields.email.trim(),
                // Which language the visitor wrote from, so I can answer in it.
                language,
                // Honeypot: always empty for people; Web3Forms drops the
                // submission when a bot fills it in.
                botcheck,
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
        <p className={styles.noticeTitle}>{t("sentTitle")}</p>
        <p>{t("sentText")}</p>
        <button type="button" className={styles.textButton} onClick={() => setStatus("idle")}>
          {t("sendAnother")}
        </button>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={sending}>
      <Field id="name" label={t("name")} error={errors.name}>
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

      <Field id="email" label={t("email")} error={errors.email}>
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

      <Field id="message" label={t("message")} error={errors.message}>
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
        <label htmlFor="botcheck">{t("honeypot")}</label>
        <input ref={honeypot} id="botcheck" name="botcheck" type="checkbox" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={styles.captcha}>
        {/* key: the widget only picks up a new theme or size when recreated. */}
        <HCaptcha
          key={`${theme}-${compact}`}
          size={compact ? "compact" : "normal"}
          ref={captchaRef}
          sitekey={setup.sitekey}
          reCaptchaCompat={false}
          theme={theme}
          // The check speaks the page's language.
          languageOverride={locale}
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
          <p className={styles.noticeTitle}>{t("failedTitle")}</p>
          <p>
            {t("failedText")}
            {linkedinUrl && (
              <>
                {" "}
                {t.rich("failedLinkedin", {
                  link: (chunks) => (
                    <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
                      {chunks}
                    </a>
                  ),
                })}
              </>
            )}
          </p>
        </div>
      )}

      <button type="submit" className={styles.submit} disabled={sending}>
        {sending ? t("sending") : t("send")}
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

function trimmed(fields: Fields): Fields {
  return { name: fields.name.trim(), email: fields.email.trim(), message: fields.message.trim() };
}
