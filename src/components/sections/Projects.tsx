import { findLink } from "@/lib/profile";
import { getGroups, getProjects } from "@/lib/projects";
import { ProjectTabs, type ProjectCardData } from "./ProjectTabs";
import styles from "./Projects.module.css";

export function Projects() {
  const all = getProjects();
  // Plain objects only: this data is handed to a client component.
  const projects: ProjectCardData[] = all.map((p) => ({
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    group: p.group,
    languages: p.languages.map((l) => l.name),
    isFork: p.forkOf !== null,
    codeUrl: p.codeUrl,
    demoUrl: p.demoUrl,
    image: p.image,
  }));
  const github = findLink("github");

  const heading = (
    <h2 id="projects-title" className="section-title">
      Things I’ve built.
    </h2>
  );

  return (
    <section id="projects" className={styles.projects} aria-labelledby="projects-title">
      <div className={`container ${styles.inner}`}>
        {projects.length > 0 ? (
          <ProjectTabs projects={projects} groups={getGroups(all)} heading={heading} githubUrl={github?.url} />
        ) : (
          <>
            {heading}
            <p className={styles.empty}>
              Projects will appear here soon.
              {github && (
                <>
                  {" "}
                  Meanwhile, my code is on <a href={github.url}>GitHub</a>.
                </>
              )}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
