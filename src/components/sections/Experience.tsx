import { getLocale, getTranslations } from "next-intl/server";
import { LiftCard } from "@/components/ui/LiftCard";
import { Reveal } from "@/components/ui/Reveal";
import { languageInfo } from "@/i18n/config";
import { formatDuration, formatRange } from "@/lib/dates";
import { getProfile } from "@/lib/profile";
import styles from "./Experience.module.css";
import { RevealText } from "@/components/motion/RevealText";
import { Timeline } from "@/components/motion/Timeline";
import { highlightPlan, markTerms, stackGroup } from "../../../scripts/lib/stack.mjs";

/**
 * Style that colours a chip or term by its stack group (Java, data, DevOps ...),
 * through the --stack-<group> variables in globals.css. No group: the accent.
 */
function groupStyle(nameOrTerm: string) {
  const group = stackGroup(nameOrTerm);
  return group ? ({ "--stack-color": `var(--stack-${group.id})` } as React.CSSProperties) : undefined;
}

/** A text with the given stack terms in bold, in their group's colour (first mention in the job; see scripts/lib/stack.mjs). */
function Marked({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return text;
  return markTerms(text, terms).map((piece, i) => (piece.mark ? (
      <strong key={i} style={groupStyle(piece.text)}>
        {piece.text}
      </strong>
    ) : (
      piece.text
    )));
}

// The one light band of the page (in both themes).
export async function Experience() {
  const profile = await getProfile();
  const t = await getTranslations("experience");
  const tDates = await getTranslations("dates");
  const { intl } = languageInfo(await getLocale());
  return (
    <section
      id="experience"
      className={`band-light blend-top ${styles.experience}`}
      style={{ "--blend-from": "var(--band-dark-bg)" } as React.CSSProperties}
      aria-labelledby="experience-title"
    >
      <div className={`container ${styles.inner}`}>
        <RevealText id="experience-title" className="section-title" text={t("title")} />
        <Timeline className={`${styles.grid} ${styles.timeline}`} lineClassName={styles.line} progressClassName={styles.lineProgress}>
          {profile.experience.map((job, i) => {
            // Stack terms to mark: plan[0] for the summary, plan[1...] for the bullets.
            const plan = highlightPlan([job.summary, ...job.highlights], job.stack);
            return (
              <Reveal key={job.company} className={styles.cell} delay={0.15 + (i % 2) * 0.08}>
                <LiftCard className={styles.card}>
                  <p className={styles.meta} data-job="">
                    <span className={styles.dot} aria-hidden="true" />
                    {formatRange(job.start, job.end, intl, tDates)} · {formatDuration(job.start, job.end, intl, tDates)} · {job.city}
                  </p>
                  <h3 className={styles.company}>{job.company}</h3>
                  <p className={styles.role}>{job.role}</p>
                  {job.stack?.length ? (
                    // The same chips as in the CV. Real text, read out as a list.
                    <ul className={styles.stack} aria-label={t("stack")}>
                      {job.stack.map((name) => (
                        <li key={name} className={styles.chip} style={groupStyle(name)}>
                          {name}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className={styles.summary}>
                    <Marked text={job.summary} terms={plan[0]} />
                  </p>
                  <details className={styles.details}>
                    {/* Native <details>: works and is readable without JavaScript;
                        the height animation is pure CSS where supported. */}
                    <summary>
                      <span className={styles.showLabel}>{t("showDetails")}</span>
                      <span className={styles.hideLabel}>{t("hideDetails")}</span>
                    </summary>
                    <ul>
                      {job.highlights.map((line, j) => (
                        <li key={line}>
                          <Marked text={line} terms={plan[j + 1]} />
                        </li>
                      ))}
                    </ul>
                  </details>
                </LiftCard>
              </Reveal>
            );
          })}
        </Timeline>
      </div>
    </section>
  );
}
