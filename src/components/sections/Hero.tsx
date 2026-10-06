import { DownloadIcon } from "@/components/ui/icons";
import { PillLink } from "@/components/ui/PillLink";
import { ScrollEaseBack } from "@/components/motion/ScrollEaseBack";
import { HeroDotField } from "./HeroDotField";
import { profile, statusLine } from "@/lib/profile";
import styles from "./Hero.module.css";

export function Hero() {
  const [lineOne, lineTwo] = profile.intro.headline;
  return (
    <section id="top" className={styles.hero} aria-labelledby="hero-title">
      <HeroDotField className={styles.dots} />
      <div className={`container ${styles.inner}`}>
        <ScrollEaseBack className={styles.text}>
          <p className={styles.status}>
            <span className={styles.statusDot} aria-hidden="true" />
            {statusLine()}
          </p>
          <p className={styles.location}>{profile.location}</p>
          <h1 id="hero-title" className={styles.title}>
            <span className={styles.line}>{lineOne}</span>
            <span className={`${styles.line} ${styles.accent}`}>{lineTwo}</span>
          </h1>
          <p className={styles.pitch}>{profile.intro.pitch}</p>
          <div className={styles.buttons}>
            <PillLink href={profile.cv.path} download={profile.cv.downloadName} track="cv">
              <DownloadIcon />
              Download CV
            </PillLink>
            <PillLink href="/#projects" variant="outline">
              See projects
            </PillLink>
          </div>
        </ScrollEaseBack>
      </div>
    </section>
  );
}
