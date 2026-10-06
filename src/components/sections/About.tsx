import Image from "next/image";
import { ParallaxPhoto } from "@/components/motion/ParallaxPhoto";
import { Reveal } from "@/components/ui/Reveal";
import { profile } from "@/lib/profile";
import styles from "./About.module.css";
import { RevealText } from "@/components/motion/RevealText";

// Full-width black band in both themes. On wide screens the photo fills the
// band with me on the right and the text over the dark left side; on phones
// the photo sits above the text.
export function About() {
  return (
    <section
      id="about"
      className={`band-dark blend-top ${styles.about}`}
      style={{ "--blend-from": "var(--page-bg)" } as React.CSSProperties}
      aria-labelledby="about-title"
    >
      <ParallaxPhoto className={styles.photo}>
        <Image
          src={profile.about.image}
          alt={profile.about.imageAlt}
          fill
          // The photo spans the full width of the band on every screen size.
          sizes="100vw"
          // High quality so the face stays sharp (92 must also be listed in
          // images.qualities in next.config.ts, or Next.js lowers it to 75).
          quality={92}
          className={styles.image}
        />
      </ParallaxPhoto>
      <div className={`container ${styles.inner}`}>
        <Reveal className={styles.text}>
          <h2 id="about-title" className="eyebrow">
            About
          </h2>
          <RevealText as="p" className={styles.lead} text={profile.about.lead} />
          <p className={styles.body}>{profile.about.body}</p>
        </Reveal>
      </div>
    </section>
  );
}
