import { PillLink } from "@/components/ui/PillLink";
import styles from "./not-found.module.css";
import { PageTransition } from "@/components/motion/PageTransition";

export default function NotFound() {
  return (
    <PageTransition>
      <section className={styles.page}>
        <div className={`container ${styles.inner}`}>
          <p className="eyebrow">404</p>
          <h1 className={styles.title}>This page does not exist.</h1>
          <PillLink href="/">Back to the home page</PillLink>
        </div>
      </section>
    </PageTransition>
  );
}
