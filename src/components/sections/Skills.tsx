import { Reveal } from "@/components/ui/Reveal";
import { profile } from "@/lib/profile";
import { SkillCloud } from "./SkillCloud";
import styles from "./Skills.module.css";

export function Skills() {
  return (
    <section id="skills" className={styles.skills} aria-labelledby="skills-title">
      <div className={`container ${styles.inner}`}>
        <Reveal>
          <h2 id="skills-title" className="section-title">
            What I work with.
          </h2>
        </Reveal>
        <SkillCloud skills={profile.skills} />
      </div>
    </section>
  );
}
