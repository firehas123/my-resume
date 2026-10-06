import { LiftCard } from "@/components/ui/LiftCard";
import { Reveal } from "@/components/ui/Reveal";
import { formatDuration, formatRange, profile } from "@/lib/profile";
import styles from "./Experience.module.css";
import { RevealText } from "@/components/motion/RevealText";
import { Timeline } from "@/components/motion/Timeline";

// The one light band of the page (in both themes).
export function Experience() {
  return (
    <section
      id="experience"
      className={`band-light blend-top ${styles.experience}`}
      style={{ "--blend-from": "var(--band-dark-bg)" } as React.CSSProperties}
      aria-labelledby="experience-title"
    >
      <div className={`container ${styles.inner}`}>
        <RevealText id="experience-title" className="section-title" text="Where I’ve worked." />
        <Timeline className={`${styles.grid} ${styles.timeline}`} lineClassName={styles.line} progressClassName={styles.lineProgress}>
          {profile.experience.map((job, i) => (
            <Reveal key={job.company} className={styles.cell} delay={0.15 + (i % 2) * 0.08}>
              <LiftCard className={styles.card}>
                <p className={styles.meta} data-job="">
                  <span className={styles.dot} aria-hidden="true" />
                  {formatRange(job.start, job.end)} · {formatDuration(job.start, job.end)} · {job.city}
                </p>
                <h3 className={styles.company}>{job.company}</h3>
                <p className={styles.role}>{job.role}</p>
                <p className={styles.summary}>{job.summary}</p>
                <details className={styles.details}>
                  {/* Native <details>: works and is readable without JavaScript;
                      the height animation is pure CSS where supported. */}
                  <summary>
                    <span className={styles.showLabel}>Show details</span>
                    <span className={styles.hideLabel}>Hide details</span>
                  </summary>
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
        </Timeline>
      </div>
    </section>
  );
}
