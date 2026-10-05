import styles from "./LegalPage.module.css";

// Shared layout for the Impressum and Datenschutz placeholder pages.
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

/** A clearly visible box that marks the page as unfinished. */
export function TodoNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.todo} role="note">
      <p className={styles.todoTitle}>TODO: placeholder</p>
      {children}
    </div>
  );
}
