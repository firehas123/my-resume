import { PillLink } from "@/components/ui/PillLink";
import { Reveal } from "@/components/ui/Reveal";
import { visibleLinks } from "@/lib/profile";
import { trackName } from "@/lib/stats/track";
import styles from "./ContactCall.module.css";
import { Magnetic } from "@/components/motion/Magnetic";
import { RevealText } from "@/components/motion/RevealText";

// The closing black band. Phone number and email are deliberately never shown:
// the contact form is the way to reach me.
export function ContactCall() {
  return (
    <section
      className={`band-dark blend-top ${styles.contact}`}
      style={{ "--blend-from": "var(--page-bg-alt)" } as React.CSSProperties}
      aria-labelledby="contact-title"
    >
      <Reveal className={`container ${styles.inner}`}>
        {/* "Get in touch.": the letters arrive one after another. */}
        <RevealText id="contact-title" className={styles.title} text="Get in touch." mode="letters" accentFrom={2} accentClassName={styles.accent} />
        <div className={styles.buttons}>
          <Magnetic>
            <PillLink href="/contact" track="ask">
              Ask me a question
            </PillLink>
          </Magnetic>
          {visibleLinks.map((link) => (
            <Magnetic key={link.id}>
              <PillLink href={link.url} variant="outline" track={trackName(link.id)}>
                {link.label}
              </PillLink>
            </Magnetic>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
