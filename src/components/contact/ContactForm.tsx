"use client";

import { useRef, useState } from "react";
import styles from "./ContactForm.module.css";

// The contact form posts to an external form service (for example Formspree).
// Its address comes from NEXT_PUBLIC_FORM_ENDPOINT; see README.md. While the
// address is empty, the form says so and never pretends to send.

type Fields = { name: string; email: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;
type Status = "idle" | "sending" | "sent" | "failed";

const LIMITS = { name: 100, message: 5000 };
// Deliberately simple: something@something.something. The form service and
// my reply are the real check.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function ContactForm({ endpoint }: { endpoint: string }) {
  const connected = endpoint.length > 0;
  const [fields, setFields] = useState<Fields>({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const honeypot = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function update(field: keyof Fields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    // Clear a field's error as soon as the visitor starts fixing it.
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!connected || status === "sending") return;

    const found = validate(fields);
    setErrors(found);
    const firstInvalid = (Object.keys(found) as (keyof Fields)[])[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    // Spam bots fill in every field, including the hidden one. Act as if the
    // message was sent, but do not send it.
    if (honeypot.current?.value) {
      setStatus("sent");
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: fields.name.trim(),
          email: fields.email.trim(),
          message: fields.message.trim(),
        }),
      });
      if (!response.ok) throw new Error(`Form service answered ${response.status}`);
      setStatus("sent");
      setFields({ name: "", email: "", message: "" });
    } catch {
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <div className={`${styles.notice} ${styles.success}`} role="status">
        <p className={styles.noticeTitle}>Thank you, your message is on its way.</p>
        <p>I will reply to the email address you gave.</p>
        <button type="button" className={styles.textButton} onClick={() => setStatus("idle")}>
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate>
      {!connected && (
        <div className={styles.notice} role="note">
          <p className={styles.noticeTitle}>The contact form is not connected yet.</p>
          <p>Messages cannot be sent from here at the moment. Please reach me on LinkedIn in the meantime.</p>
        </div>
      )}

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
          disabled={!connected}
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
          disabled={!connected}
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
          disabled={!connected}
          required
        />
      </Field>

      {/* Honeypot: hidden from people (visually and from screen readers), but
          bots that fill in every field will fill this one too. */}
      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input ref={honeypot} id="website" name="_gotcha" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {status === "failed" && (
        <div className={`${styles.notice} ${styles.error}`} role="alert">
          <p className={styles.noticeTitle}>Sorry, the message could not be sent.</p>
          <p>Please check your connection and try again, or reach me on LinkedIn.</p>
        </div>
      )}

      <button type="submit" className={styles.submit} disabled={!connected || status === "sending"}>
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
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
