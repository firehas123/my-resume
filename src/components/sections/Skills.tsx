import { getTranslations } from "next-intl/server";
import { getProfile } from "@/lib/profile";
import { skillIcon } from "@/lib/skillIcons";
import { SkillCloud, type CloudSkill } from "./SkillCloud";
import styles from "./Skills.module.css";
import { RevealText } from "@/components/motion/RevealText";

export async function Skills() {
  const profile = await getProfile();
  const t = await getTranslations("skills");
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
        <RevealText id="skills-title" className="section-title" text={t("title")} />
        <SkillCloud skills={skills} label={t("cloudLabel")} />
      </div>
    </section>
  );
}
