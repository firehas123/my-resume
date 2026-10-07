import { getLocale, getTranslations } from "next-intl/server";
import { PillLink } from "@/components/ui/PillLink";
import { languageInfo } from "@/i18n/config";
import { Reveal } from "@/components/ui/Reveal";
import { visibleLinks } from "@/lib/profile";
import { trackName } from "@/lib/stats/track";
import styles from "./ContactCall.module.css";
import { Magnetic } from "@/components/motion/Magnetic";
import { RevealText } from "@/components/motion/RevealText";

// The closing black band. Phone number and email are deliberately never shown:
// the contact form is the way to reach me.
export async function ContactCall() {
  const t = await getTranslations("contactCall");
  const title = t("title");
  // Letters arrive one by one, except in scripts whose letters join (Arabic):
  // there the words rise instead, so the letters stay connected.
  const { letters } = languageInfo(await getLocale());
  return (
    <section
      className={`band-dark blend-top ${styles.contact}`}
      style={{ "--blend-from": "var(--page-bg-alt)" } as React.CSSProperties}
      aria-labelledby="contact-title"
    >
      <Reveal className={`container ${styles.inner}`}>
        {/* "Get in touch.": the last word is in the accent colour. */}
        <RevealText
          id="contact-title"
          className={styles.title}
          text={title}
          mode={letters ? "letters" : "lines"}
          accentFrom={title.split(" ").length - 1}
          accentClassName={styles.accent}
        />
        <div className={styles.buttons}>
          <Magnetic>
            <PillLink href="/contact" track="ask">
              {t("ask")}
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
