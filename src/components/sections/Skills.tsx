import { Reveal } from "@/components/ui/Reveal";
import { profile } from "@/lib/profile";
import { skillIcon } from "@/lib/skillIcons";
import { SkillCloud, type CloudSkill } from "./SkillCloud";
import styles from "./Skills.module.css";

export function Skills() {
  // Resolve each skill's logos here, on the server, so the browser only
  // receives plain data (icon URL, shape and hover colours).
  const skills: CloudSkill[] = profile.skills.map((skill) => ({
    name: skill.name,
    size: skill.size,
    icons: (skill.logos ?? []).map(skillIcon),
  }));

  return (
    <section id="skills" className={styles.skills} aria-labelledby="skills-title">
      <div className={`container ${styles.inner}`}>
        <Reveal>
          <h2 id="skills-title" className="section-title">
            What I work with.
          </h2>
        </Reveal>
        <SkillCloud skills={skills} />
      </div>
    </section>
  );
}
