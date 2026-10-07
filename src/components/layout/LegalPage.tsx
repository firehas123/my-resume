import styles from "./LegalPage.module.css";

// Shared layout for the Legal Notice and the Privacy Policy. The text is
// Markdown from content/legal/, converted at build time (src/lib/legal.ts).
export function LegalPage({ title, html }: { title: string; html: string }) {
  return (
    <article className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.body} dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </article>
  );
}
