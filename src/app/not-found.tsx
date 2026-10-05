import { PillLink } from "@/components/ui/PillLink";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <section className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <p className="eyebrow">404</p>
        <h1 className={styles.title}>This page does not exist.</h1>
        <PillLink href="/">Back to the home page</PillLink>
      </div>
    </section>
  );
}
