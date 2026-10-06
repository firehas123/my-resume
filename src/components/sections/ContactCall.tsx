import { PillLink } from "@/components/ui/PillLink";
import { Reveal } from "@/components/ui/Reveal";
import { visibleLinks } from "@/lib/profile";
import { trackName } from "@/lib/stats/track";
import styles from "./ContactCall.module.css";

// The closing black band. Phone number and email are deliberately never shown:
// the contact form is the way to reach me.
export function ContactCall() {
  return (
    <section className={`band-dark ${styles.contact}`} aria-labelledby="contact-title">
      <Reveal className={`container ${styles.inner}`}>
        <h2 id="contact-title" className={styles.title}>
          Get in <span className={styles.accent}>touch.</span>
        </h2>
        <div className={styles.buttons}>
          <PillLink href="/contact" track="ask">
            Ask me a question
          </PillLink>
          {visibleLinks.map((link) => (
            <PillLink key={link.id} href={link.url} variant="outline" track={trackName(link.id)}>
              {link.label}
            </PillLink>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
