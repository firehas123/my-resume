import { LiftCard } from "@/components/ui/LiftCard";
import { Reveal } from "@/components/ui/Reveal";
import { formatRange, profile } from "@/lib/profile";
import styles from "./Education.module.css";

export function Education() {
  return (
    <section id="education" className={styles.education} aria-labelledby="education-title">
      <div className={`container ${styles.inner}`}>
        <Reveal>
          <h2 id="education-title" className={styles.title}>
            Education and certifications.
          </h2>
        </Reveal>

        <div className={styles.grid}>
          {profile.education.map((item, i) => (
            <Reveal key={item.degree} className={styles.cell} delay={(i % 2) * 0.08}>
              <LiftCard className={styles.card}>
                <p className={styles.meta}>
                  {formatRange(item.start, item.end)}
                  {item.note && ` · ${item.note}`}
                </p>
                <h3 className={styles.heading}>{item.degree}</h3>
                <p className={styles.muted}>{item.school}</p>
              </LiftCard>
            </Reveal>
          ))}

          <Reveal className={styles.cell}>
            <LiftCard className={styles.card}>
              <h3 className={styles.heading}>Certifications</h3>
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
              <h3 className={styles.heading}>Languages</h3>
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
