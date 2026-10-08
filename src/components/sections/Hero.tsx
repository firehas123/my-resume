import { Fragment } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { languageInfo } from "@/i18n/config";
import { CvDownload } from "@/components/ui/CvDownload";
import { PillLink } from "@/components/ui/PillLink";
import { Magnetic } from "@/components/motion/Magnetic";
import { ScrollEaseBack } from "@/components/motion/ScrollEaseBack";
import { HeroDotField } from "./HeroDotField";
import { cvFiles } from "@/lib/cv";
import { getProfile, type Profile } from "@/lib/profile";
import styles from "./Hero.module.css";

/**
 * "Working student at Zertificon · M.Sc. AI at FAU": the current job (no end
 * date) and current studies ("present"), built from profile.json. English
 * job titles are written in Title Case, so in the middle of the line they
 * are lowered ("lowerRoles" in languages.json); other languages keep theirs.
 */
function statusParts(profile: Profile, t: (key: string, values?: Record<string, string>) => string, lowerRoles: boolean): string[] {
  const job = profile.experience.find((j) => j.end === null);
  const study = profile.education.find((e) => e.end === "present");
  const parts = [];
  if (job) {
    const role = lowerRoles ? `${job.role[0]}${job.role.slice(1).toLowerCase()}` : job.role;
    parts.push(t("statusJob", { role, company: job.company }));
  }
  if (study) parts.push(study.short ?? study.degree);
  return parts;
}

export async function Hero() {
  const profile = await getProfile();
  const t = await getTranslations("hero");
  const locale = await getLocale();
  const cv = await cvFiles(locale);
  const [lineOne, lineTwo] = profile.intro.headline;
  return (
    <section id="top" className={styles.hero} aria-labelledby="hero-title">
      <HeroDotField className={styles.dots} />
      <div className={`container ${styles.inner}`}>
        <ScrollEaseBack className={styles.text}>
          <p className={styles.status}>
            <span className={styles.statusDot} aria-hidden="true" />
            {/* Each part is kept together where it fits; a narrow screen wraps
                after the "·". The space between parts sits outside them so the
                line can break there. */}
            <span>
              {statusParts(profile, t, languageInfo(locale).lowerRoles).map((part, i, all) => (
                <Fragment key={part}>
                  {i > 0 && " "}
                  <span className={styles.statusPart}>
                    {part}
                    {i < all.length - 1 && " ·"}
                  </span>
                </Fragment>
              ))}
            </span>
          </p>
          <p className={styles.location}>{profile.location}</p>
          <h1 id="hero-title" className={styles.title}>
            <span className={styles.line}>{lineOne}</span>
            <span className={`${styles.line} ${styles.accent}`}>{lineTwo}</span>
          </h1>
          <p className={styles.pitch}>{profile.intro.pitch}</p>
          <div className={styles.buttons}>
            <CvDownload {...cv} icon magnetic />
            <Magnetic>
              <PillLink href={{ pathname: "/", hash: "projects" }} variant="outline">
                {t("seeProjects")}
              </PillLink>
            </Magnetic>
          </div>
        </ScrollEaseBack>
      </div>
    </section>
  );
}
