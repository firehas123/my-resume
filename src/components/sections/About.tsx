import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { profile } from "@/lib/profile";
import styles from "./About.module.css";

// Full-width black band in both themes. On wide screens the photo fills the
// band with me on the right and the text over the dark left side; on phones
// the photo sits above the text.
export function About() {
  return (
    <section id="about" className={`band-dark ${styles.about}`} aria-labelledby="about-title">
      <div className={styles.photo}>
        <Image
          src={profile.about.image}
          alt={profile.about.imageAlt}
          fill
          sizes="100vw"
          className={styles.image}
        />
      </div>
      <div className={`container ${styles.inner}`}>
        <Reveal className={styles.text}>
          <h2 id="about-title" className="eyebrow">
            About
          </h2>
          <p className={styles.lead}>{profile.about.lead}</p>
          <p className={styles.body}>{profile.about.body}</p>
        </Reveal>
      </div>
    </section>
  );
}
