import { LiftCard } from "@/components/ui/LiftCard";
import { Reveal } from "@/components/ui/Reveal";
import { formatRange, profile } from "@/lib/profile";
import styles from "./Experience.module.css";

// The one light band of the page (in both themes).
export function Experience() {
  return (
    <section id="experience" className={`band-light ${styles.experience}`} aria-labelledby="experience-title">
      <div className={`container ${styles.inner}`}>
        <Reveal>
          <h2 id="experience-title" className="section-title">
            Where I’ve worked.
          </h2>
        </Reveal>
        <div className={styles.grid}>
          {profile.experience.map((job, i) => (
            <Reveal key={job.company} className={styles.cell} delay={(i % 2) * 0.08}>
              <LiftCard className={styles.card}>
                <p className={styles.meta}>
                  {formatRange(job.start, job.end)} · {job.city}
                </p>
                <h3 className={styles.company}>{job.company}</h3>
                <p className={styles.role}>{job.role}</p>
                <p className={styles.summary}>{job.summary}</p>
                <details className={styles.details}>
                  <summary>Highlights</summary>
                  <ul>
                    {job.highlights.map((line) => (
                      <li key={line}>
                        {line}
                      </li>
                    ))}
                  </ul>
                </details>
              </LiftCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
