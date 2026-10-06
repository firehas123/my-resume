import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { visibleLinks } from "@/lib/profile";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description: "Ask me a question. I reply by email.",
};

export default function ContactPage() {
  // NEXT_PUBLIC_ variables are filled in when the site is built, so after
  // setting it on Vercel the site must be redeployed (see README.md).
  const endpoint = process.env.NEXT_PUBLIC_FORM_ENDPOINT?.trim() ?? "";

  return (
    <section className={styles.page} aria-labelledby="contact-title">
      <div className={`container ${styles.inner}`}>
        <div className={styles.intro}>
          <h1 id="contact-title" className={styles.title}>
            Ask me a <span className={styles.accent}>question.</span>
          </h1>
          <p className={styles.lead}>About a role, a project or anything on this site. I reply by email.</p>
          {visibleLinks.length > 0 && (
            <p className={styles.links}>
              Or find me on{" "}
              {visibleLinks.map((link, i) => (
                <span key={link.id}>
                  {i > 0 && (i === visibleLinks.length - 1 ? " and " : ", ")}
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </span>
              ))}
              .
            </p>
          )}
        </div>
        <div className={styles.formWrap}>
          <ContactForm endpoint={endpoint} />
        </div>
      </div>
    </section>
  );
}
