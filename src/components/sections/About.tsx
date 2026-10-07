import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ParallaxPhoto } from "@/components/motion/ParallaxPhoto";
import { Reveal } from "@/components/ui/Reveal";
import { getProfile } from "@/lib/profile";
import styles from "./About.module.css";
import { RevealText } from "@/components/motion/RevealText";

// Full-width black band in both themes. On wide screens the photo fills the
// band with me on the far side and the text over the dark side nearest the
// start of the line; on phones the photo sits above the text.
export async function About() {
  const profile = await getProfile();
  const t = await getTranslations("about");
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
            {t("eyebrow")}
          </h2>
          <RevealText as="p" className={styles.lead} text={profile.about.headline} />
          {/* One statement per line, each fading in a little after the one
              before it; the last one is in the accent colour. */}
          <ul className={styles.statements}>
            {profile.about.statements.map((statement, i, all) => (
              <li key={statement} className={i === all.length - 1 ? styles.accent : undefined}>
                <Reveal delay={0.35 + i * 0.15}>{statement}</Reveal>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
