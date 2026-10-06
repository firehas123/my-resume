import styles from "./LegalPage.module.css";

// Shared layout for the Impressum and Datenschutz pages.
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.body}>{children}</div>
      </div>
    </article>
  );
}
