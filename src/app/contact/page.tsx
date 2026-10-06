import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { findLink, profile, visibleLinks } from "@/lib/profile";
import { trackName } from "@/lib/stats/track";
import styles from "./page.module.css";
import { PageTransition } from "@/components/motion/PageTransition";

export const metadata: Metadata = {
  title: "Contact",
  description: "Ask me a question. I reply by email.",
};

export default function ContactPage() {
  // The Web3Forms key from profile.json; NEXT_PUBLIC_WEB3FORMS_KEY overrides it.
  const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_KEY?.trim() || profile.contactAccessKey;

  return (
    <PageTransition>
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
                    <a href={link.url} className="u-link" target="_blank" rel="noopener noreferrer" data-track={trackName(link.id)}>
                      {link.label}
                    </a>
                  </span>
                ))}
                .
              </p>
            )}
          </div>
          <div className={styles.formWrap}>
            <ContactForm accessKey={accessKey} linkedinUrl={findLink("linkedin")?.url} />
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
