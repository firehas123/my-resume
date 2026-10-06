"use client";

import { DURATION, EASE_OUT } from "@/lib/motion";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { LiftCard } from "@/components/ui/LiftCard";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./Projects.module.css";

export type ProjectCardData = {
  slug: string;
  title: string;
  summary: string;
  group: string; // the tab it belongs to
  languages: string[]; // top languages, largest first
  isFork: boolean;
  codeUrl: string;
  demoUrl: string | null;
  image: string | null;
};

type ProjectTabsProps = {
  projects: ProjectCardData[];
  /** One tab per group that has projects, already in display order. */
  groups: string[];
  heading: React.ReactNode;
  githubUrl?: string;
};

// How many cards a tab shows before "Show all".
const INITIAL_COUNT = 6;

export function ProjectTabs({ projects, groups, heading, githubUrl }: ProjectTabsProps) {
  // Every group passed in has at least one project, so start on the first.
  const [active, setActive] = useState(groups[0]);
  const [showAll, setShowAll] = useState(false);

  const inGroup = projects.filter((p) => p.group === active);
  const visible = showAll ? inGroup : inGroup.slice(0, INITIAL_COUNT);

  function selectGroup(group: string) {
    setActive(group);
    setShowAll(false);
  }

  return (
    <>
      <Reveal className={styles.header}>
        {heading}
        <div className={styles.tabs} role="group" aria-label="Filter projects by language">
          {groups.map((group) => (
            <button
              key={group}
              type="button"
              className={styles.tab}
              aria-pressed={group === active}
              onClick={() => selectGroup(group)}
            >
              {group}
            </button>
          ))}
        </div>
      </Reveal>

      {/* Announces the result of a filter change to screen readers. */}
      <p className="visually-hidden" aria-live="polite">
        {`${inGroup.length} ${active} ${inGroup.length === 1 ? "project" : "projects"}`}
      </p>

      {/* `key` makes the grid re-mount, and fade in, whenever the tab changes. */}
      <motion.div
        key={active}
        className={styles.grid}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.standard, ease: EASE_OUT }}
      >
        {visible.map((project) => (
          <div key={project.slug} className={styles.cell}>
            <ProjectCard project={project} />
          </div>
        ))}
      </motion.div>

      <div className={styles.footer}>
        {inGroup.length > INITIAL_COUNT && (
          <button type="button" className={styles.more} onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
            {showAll ? "Show fewer" : `Show all ${inGroup.length} ${active} projects`}
          </button>
        )}
        {githubUrl && (
          <a href={githubUrl} className={styles.moreLink} target="_blank" rel="noopener noreferrer">
            All repositories on GitHub
          </a>
        )}
      </div>
    </>
  );
}

function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <LiftCard className={styles.card}>
      {project.image && (
        <div className={styles.media}>
          <Image src={project.image} alt="" fill sizes="(max-width: 960px) 100vw, 540px" className={styles.mediaImage} />
        </div>
      )}
      <div className={styles.body}>
        <p className={styles.language}>{project.group}</p>
        <h3 className={styles.title}>{project.title}</h3>
        {project.summary && <p className={styles.summary}>{project.summary}</p>}
        {(project.isFork || project.languages.length > 0) && (
          <ul className={styles.languageTags} aria-label="Labels">
            {project.isFork && <li className={styles.forkTag}>Fork</li>}
            {project.languages.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        )}
        <div className={styles.links}>
          <Link href={`/projects/${project.slug}`}>
            Details<span className="visually-hidden"> about {project.title}</span>
          </Link>
          <a href={project.codeUrl} target="_blank" rel="noopener noreferrer">
            Code<span className="visually-hidden"> of {project.title} on GitHub</span>
          </a>
          {project.demoUrl && (
            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
              Live demo<span className="visually-hidden"> of {project.title}</span>
            </a>
          )}
        </div>
      </div>
    </LiftCard>
  );
}
