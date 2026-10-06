import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeftIcon, ExternalIcon } from "@/components/ui/icons";
import { PillLink } from "@/components/ui/PillLink";
import { formatLanguage, getProject, getProjects, getWriteupHtml } from "@/lib/projects";
import styles from "./page.module.css";

// Every project page is generated at build time. Unknown slugs return 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary || `${project.title}, a ${project.group} project on GitHub.`,
  };
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const writeup = await getWriteupHtml(project);

  return (
    <article className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <Link href="/#projects" className={styles.back}>
          <ArrowLeftIcon size={18} />
          All projects
        </Link>

        <header className={styles.header}>
          <p className={styles.language}>{project.group}</p>
          <h1 className={styles.title}>{project.title}</h1>
          {project.summary && <p className={styles.summary}>{project.summary}</p>}
          <p className={styles.meta}>
            {project.forkOf && <>Fork of {project.forkOf} · </>}
            Last updated {dateFormat.format(new Date(project.pushedAt))}
          </p>
          {(project.forkOf || project.languages.length > 0) && (
            <ul className={styles.languageTags} aria-label="Labels">
              {project.forkOf && <li className={styles.forkTag}>Fork</li>}
              {project.languages.map((language) => (
                <li key={language.name}>{formatLanguage(language)}</li>
              ))}
            </ul>
          )}
          {project.topics.length > 0 && (
            <ul className={styles.topics} aria-label="Topics">
              {project.topics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          )}
          <div className={styles.buttons}>
            <PillLink href={project.codeUrl}>
              Code on GitHub
              <ExternalIcon size={18} />
            </PillLink>
            {project.demoUrl && (
              <PillLink href={project.demoUrl} variant="outline">
                Live demo
                <ExternalIcon size={18} />
              </PillLink>
            )}
          </div>
        </header>

        {project.image && (
          <div className={styles.media}>
            <Image src={project.image} alt={`Screenshot of ${project.title}`} fill sizes="(max-width: 1120px) 100vw, 1072px" className={styles.mediaImage} />
          </div>
        )}

        {writeup ? (
          // The write-up is my own Markdown from content/projects/, converted at build time.
          <div className={styles.writeup} dangerouslySetInnerHTML={{ __html: writeup }} />
        ) : (
          <p className={styles.note}>
            The full source code and README are on{" "}
            <a href={project.codeUrl} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            .
          </p>
        )}
      </div>
    </article>
  );
}
