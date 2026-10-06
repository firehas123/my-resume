"use client";

import { motion, useScroll } from "motion/react";
import styles from "./Header.module.css";

/** A thin accent line under the header showing how far down the page you are. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return <motion.span className={styles.progress} style={{ scaleX: scrollYProgress }} aria-hidden="true" />;
}
