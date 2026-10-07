import { getLocale, getTranslations } from "next-intl/server";
import { findLink } from "@/lib/profile";
import { getGroups, getProjects } from "@/lib/projects";
import { ProjectTabs, type ProjectCardData } from "./ProjectTabs";
import styles from "./Projects.module.css";
import { RevealText } from "@/components/motion/RevealText";

export async function Projects() {
  const t = await getTranslations("projects");
  const all = getProjects(await getLocale());
  // Plain objects only: this data is handed to a client component.
  const projects: ProjectCardData[] = all.map((p) => ({
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    summaryInEnglish: p.summaryInEnglish,
    group: p.group,
    languages: p.languages.map((l) => l.name),
    isFork: p.forkOf !== null,
    codeUrl: p.codeUrl,
    demoUrl: p.demoUrl,
    image: p.image,
  }));
  const github = findLink("github");

  const heading = (
    <RevealText id="projects-title" className="section-title" text={t("title")} />
  );

  return (
    <section
      id="projects"
      className={`blend-top ${styles.projects}`}
      style={{ "--blend-from": "var(--band-light-bg)" } as React.CSSProperties}
      aria-labelledby="projects-title"
    >
      <div className={`container ${styles.inner}`}>
        {projects.length > 0 ? (
          <ProjectTabs projects={projects} groups={getGroups(all)} heading={heading} githubUrl={github?.url} />
        ) : (
          <>
            {heading}
            <p className={styles.empty}>
              {t("empty")}
              {github && (
                <>
                  {" "}
                  {t.rich("emptyGithub", { link: (chunks) => <a href={github.url}>{chunks}</a> })}
                </>
              )}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
