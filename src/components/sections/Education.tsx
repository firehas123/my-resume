import { getLocale, getTranslations } from "next-intl/server";
import { LiftCard } from "@/components/ui/LiftCard";
import { Reveal } from "@/components/ui/Reveal";
import { languageInfo } from "@/i18n/config";
import { formatRange } from "@/lib/dates";
import { getProfile } from "@/lib/profile";
import styles from "./Education.module.css";
import { RevealText } from "@/components/motion/RevealText";

export async function Education() {
  const profile = await getProfile();
  const t = await getTranslations("education");
  const tDates = await getTranslations("dates");
  const { intl } = languageInfo(await getLocale());
  return (
    <section id="education" className={styles.education} aria-labelledby="education-title">
      <div className={`container ${styles.inner}`}>
        <RevealText id="education-title" className={styles.title} text={t("title")} />

        <div className={styles.grid}>
          {profile.education.map((item, i) => (
            <Reveal key={item.degree} className={styles.cell} delay={(i % 2) * 0.08}>
              <LiftCard className={styles.card}>
                <p className={styles.meta}>
                  {formatRange(item.start, item.end, intl, tDates)}
                  {item.note && ` · ${item.note}`}
                </p>
                <h3 className={styles.heading}>{item.degree}</h3>
                <p className={styles.muted}>{item.school}</p>
              </LiftCard>
            </Reveal>
          ))}

          <Reveal className={styles.cell}>
            <LiftCard className={styles.card}>
              <h3 className={styles.heading}>{t("certifications")}</h3>
              <ul className={styles.list}>
                {profile.certifications.map((cert) => (
                  <li key={cert.name}>
                    <span className={styles.itemName}>{cert.name}</span>
                    <span className={styles.muted}>{cert.detail}</span>
                  </li>
                ))}
              </ul>
            </LiftCard>
          </Reveal>

          <Reveal className={styles.cell} delay={0.08}>
            <LiftCard className={styles.card}>
              <h3 className={styles.heading}>{t("languages")}</h3>
              <ul className={styles.list}>
                {profile.languages.map((language) => (
                  <li key={language.name}>
                    <span className={styles.itemName}>{language.name}</span>
                    {language.level && <span className={styles.muted}>{language.level}</span>}
                  </li>
                ))}
              </ul>
            </LiftCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
