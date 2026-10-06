"use client";

import { DURATION, EASE_OUT } from "@/lib/motion";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useState, useSyncExternalStore, ViewTransition } from "react";
import { TiltCard } from "@/components/motion/TiltCard";
import { ProjectTile } from "@/components/ui/ProjectTile";
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

function subscribeToHistory(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function readTabParam(): string | null {
  return new URLSearchParams(window.location.search).get("tab");
}

// Tab change: the cards cross-fade in, one shortly after another.
const GRID = { show: { transition: { staggerChildren: 0.05 } } };
const CELL = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.standard, ease: EASE_OUT } },
};

// How many cards a tab shows before "Show all".
const INITIAL_COUNT = 6;

export function ProjectTabs({ projects, groups, heading, githubUrl }: ProjectTabsProps) {
  // The selected tab lives in the address (?tab=Python), so coming back to the
  // home page (back button or "All projects") restores it. Read after
  // hydration; the server always renders the first tab.
  const tabFromUrl = useSyncExternalStore(subscribeToHistory, readTabParam, () => null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [switched, setSwitched] = useState(false);
  const reduceMotion = useReducedMotion();
  const active = chosen ?? (tabFromUrl && groups.includes(tabFromUrl) ? tabFromUrl : groups[0]);
  const [showAll, setShowAll] = useState(false);

  const inGroup = projects.filter((p) => p.group === active);
  const visible = showAll ? inGroup : inGroup.slice(0, INITIAL_COUNT);

  function selectGroup(group: string) {
    setSwitched(true);
    setChosen(group);
    setShowAll(false);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", group);
    window.history.replaceState(window.history.state, "", url);
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
              {/* One highlight shared by all tabs: it slides from the old tab to the new one. */}
              {group === active && (
                <motion.span
                  layoutId="project-tab-highlight"
                  className={styles.tabHighlight}
                  transition={{ duration: DURATION.standard, ease: EASE_OUT }}
                  aria-hidden="true"
                />
              )}
              <span className={styles.tabLabel}>{group}</span>
            </button>
          ))}
        </div>
      </Reveal>

      {/* Announces the result of a filter change to screen readers. */}
      <p className="visually-hidden" aria-live="polite">
        {`${inGroup.length} ${active} ${inGroup.length === 1 ? "project" : "projects"}`}
      </p>

      {/* `key` re-mounts the grid when the tab changes; the new cards then
          cross-fade in with a short stagger. Never on the first render, so the
          cards are always in the server HTML and visible without JavaScript. */}
      <motion.div
        key={active}
        className={styles.grid}
        variants={GRID}
        initial={switched && !reduceMotion ? "hidden" : false}
        animate="show"
      >
        {visible.map((project) => (
          <motion.div key={project.slug} className={styles.cell} variants={CELL}>
            <ProjectCard project={project} />
          </motion.div>
        ))}
      </motion.div>

      <div className={styles.footer}>
        {inGroup.length > INITIAL_COUNT && (
          <button type="button" className={styles.more} onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
            {showAll ? "Show fewer" : `Show all ${inGroup.length} ${active} projects`}
          </button>
        )}
        {githubUrl && (
          <a href={githubUrl} className={`u-link ${styles.moreLink}`} target="_blank" rel="noopener noreferrer">
            All repositories on GitHub
          </a>
        )}
      </div>
    </>
  );
}

function ProjectCard({ project }: { project: ProjectCardData }) {
  return (
    <TiltCard className={styles.card}>
      {/* Shared with the project page: the image grows into its hero image. */}
      <ViewTransition name={`project-media-${project.slug}`} share="morph" default="none">
        <div className={styles.media}>
          {project.image ? (
            <Image src={project.image} alt="" fill sizes="(max-width: 960px) 100vw, 540px" className={styles.mediaImage} />
          ) : (
            <ProjectTile name={project.slug} />
          )}
        </div>
      </ViewTransition>
      <div className={styles.body}>
        <p className={styles.language}>{project.group}</p>
        <ViewTransition name={`project-title-${project.slug}`} share="morph" default="none">
          <h3 className={styles.title}>{project.title}</h3>
        </ViewTransition>
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
          <Link href={`/projects/${project.slug}`} className="u-link">
            Details<span className="visually-hidden"> about {project.title}</span>
          </Link>
          <a href={project.codeUrl} className="u-link" target="_blank" rel="noopener noreferrer">
            Code<span className="visually-hidden"> of {project.title} on GitHub</span>
          </a>
          {project.demoUrl && (
            <a href={project.demoUrl} className="u-link" target="_blank" rel="noopener noreferrer">
              Live demo<span className="visually-hidden"> of {project.title}</span>
            </a>
          )}
        </div>
      </div>
    </TiltCard>
  );
}
