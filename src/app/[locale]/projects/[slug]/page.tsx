import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ViewTransition } from "react";

import { ArrowLeftIcon, ExternalIcon } from "@/components/ui/icons";
import { PillLink } from "@/components/ui/PillLink";
import { ProjectTile } from "@/components/ui/ProjectTile";
import { languageInfo } from "@/i18n/config";
import { Link } from "@/i18n/navigation";
import { profileFor } from "@/lib/profile";
import { formatLanguage, getProject, getProjects, getWriteupHtml } from "@/lib/projects";
import { alternates } from "@/lib/seo";
import styles from "./page.module.css";
import { PageTransition } from "@/components/motion/PageTransition";

// Every project page is generated at build time, in every language.
// Unknown slugs return 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/projects/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = getProject(slug, locale);
  if (!project) return {};
  const t = await getTranslations({ locale, namespace: "project" });
  const group = groupName(project.group, await getTranslations({ locale, namespace: "projects.groups" }));
  const description = project.summary || t("metaDescription", { title: project.title, group });
  const title = `${project.title} · ${profileFor(locale).shortName}`;
  // Own title and description in link previews; the image is this page's
  // generated share image (./opengraph-image.tsx).
  return {
    title: project.title,
    description,
    alternates: alternates({ pathname: "/projects/[slug]", params: { slug } }, locale),
    openGraph: { type: "article", title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}

/** Tab names come from the data; only "Other" is a word that needs translating. */
function groupName(group: string, t: { has: (key: string) => boolean; (key: string): string }): string {
  return t.has(group) ? t(group) : group;
}

export default async function ProjectPage({ params }: PageProps<"/[locale]/projects/[slug]">) {
  const { locale, slug } = await params;
  const project = getProject(slug, locale);
  if (!project) notFound();

  const t = await getTranslations("project");
  const tCommon = await getTranslations("common");
  const tProjects = await getTranslations("projects");
  const group = groupName(project.group, await getTranslations("projects.groups"));
  const writeup = await getWriteupHtml(project);
  const dateFormat = new Intl.DateTimeFormat(languageInfo(locale).intl, { month: "long", year: "numeric" });

  return (
    <PageTransition>
      <article className={styles.page}>
        <div className={`container ${styles.inner}`}>
          <Link href={{ pathname: "/", query: { tab: project.group }, hash: "projects" }} className={`u-link ${styles.back}`}>
            <ArrowLeftIcon size={18} />
            {t("allProjects")}
          </Link>

          <header className={styles.header}>
            <p className={styles.language}>{group}</p>
            <ViewTransition name={`project-title-${project.slug}`} share="morph" default="none">
              {/* Repo names stay as they are (left to right, also in Arabic). */}
              <h1 className={styles.title} dir="auto">
                {project.title}
              </h1>
            </ViewTransition>
            {project.summary && (
              <p className={styles.summary}>
                <span lang={project.summaryInEnglish ? "en" : undefined}>{project.summary}</span>
                {project.summaryInEnglish && <span className="lang-note">{tCommon("inEnglish")}</span>}
              </p>
            )}
            <p className={styles.meta}>
              {project.forkOf && <>{t("forkOf", { repo: project.forkOf })} · </>}
              {t("lastUpdated", { date: dateFormat.format(new Date(project.pushedAt)) })}
            </p>
            {(project.forkOf || project.languages.length > 0) && (
              <ul className={styles.languageTags} aria-label={tProjects("labels")}>
                {project.forkOf && <li className={styles.forkTag}>{tProjects("fork")}</li>}
                {project.languages.map((language) => (
                  <li key={language.name} dir="ltr">
                    {formatLanguage(language)}
                  </li>
                ))}
              </ul>
            )}
            {project.topics.length > 0 && (
              <ul className={styles.topics} aria-label={t("topics")}>
                {project.topics.map((topic) => (
                  <li key={topic} dir="ltr">
                    {topic}
                  </li>
                ))}
              </ul>
            )}
            <div className={styles.buttons}>
              <PillLink href={project.codeUrl}>
                {t("codeOnGithub")}
                <ExternalIcon size={18} />
              </PillLink>
              {project.demoUrl && (
                <PillLink href={project.demoUrl} variant="outline">
                  {t("liveDemo")}
                  <ExternalIcon size={18} />
                </PillLink>
              )}
            </div>
          </header>

          <ViewTransition name={`project-media-${project.slug}`} share="morph" default="none">
            <div className={styles.media}>
              {project.image ? (
                <Image src={project.image} alt={t("screenshotAlt", { title: project.title })} fill sizes="(max-width: 1120px) 100vw, 1072px" className={styles.mediaImage} />
              ) : (
                <ProjectTile name={project.slug} />
              )}
            </div>
          </ViewTransition>

          {writeup ? (
            <>
              {/* The write-up comes from the README (or content/projects/), written in English. */}
              {locale !== "en" && <p className={styles.note}>{t("readmeInEnglish")}</p>}
              <div className={styles.writeup} lang="en" dir="ltr" dangerouslySetInnerHTML={{ __html: writeup }} />
            </>
          ) : (
            <p className={styles.note}>
              {t.rich("fullCode", {
                link: (chunks) => (
                  <a href={project.codeUrl} target="_blank" rel="noopener noreferrer">
                    {chunks}
                  </a>
                ),
              })}
            </p>
          )}
        </div>
      </article>
    </PageTransition>
  );
}
