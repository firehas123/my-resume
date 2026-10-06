import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";

import { ArrowLeftIcon, ExternalIcon } from "@/components/ui/icons";
import { PillLink } from "@/components/ui/PillLink";
import { ProjectTile } from "@/components/ui/ProjectTile";
import { profile } from "@/lib/profile";
import { formatLanguage, getProject, getProjects, getWriteupHtml } from "@/lib/projects";
import styles from "./page.module.css";
import { PageTransition } from "@/components/motion/PageTransition";

// Every project page is generated at build time. Unknown slugs return 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const description = project.summary || `${project.title}, a ${project.group} project on GitHub.`;
  // Own title and description in link previews; the image is the site's
  // generated share image (src/app/opengraph-image.tsx).
  return {
    title: project.title,
    description,
    openGraph: { type: "article", title: `${project.title} · ${profile.shortName}`, description },
    twitter: { card: "summary_large_image", title: `${project.title} · ${profile.shortName}`, description },
  };
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const writeup = await getWriteupHtml(project);

  return (
    <PageTransition>
      <article className={styles.page}>
        <div className={`container ${styles.inner}`}>
          <Link href={`/?tab=${encodeURIComponent(project.group)}#projects`} className={`u-link ${styles.back}`}>
            <ArrowLeftIcon size={18} />
            All projects
          </Link>

          <header className={styles.header}>
            <p className={styles.language}>{project.group}</p>
            <ViewTransition name={`project-title-${project.slug}`} share="morph" default="none">
              <h1 className={styles.title}>{project.title}</h1>
            </ViewTransition>
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

          <ViewTransition name={`project-media-${project.slug}`} share="morph" default="none">
            <div className={styles.media}>
              {project.image ? (
                <Image src={project.image} alt={`Screenshot of ${project.title}`} fill sizes="(max-width: 1120px) 100vw, 1072px" className={styles.mediaImage} />
              ) : (
                <ProjectTile name={project.slug} />
              )}
            </div>
          </ViewTransition>

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
    </PageTransition>
  );
}
