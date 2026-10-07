import { getTranslations } from "next-intl/server";
import { PillLink } from "@/components/ui/PillLink";
import styles from "./not-found.module.css";
import { PageTransition } from "@/components/motion/PageTransition";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  return (
    <PageTransition>
      <section className={styles.page}>
        <div className={`container ${styles.inner}`}>
          <p className="eyebrow">404</p>
          <h1 className={styles.title}>{t("title")}</h1>
          <PillLink href="/">{t("back")}</PillLink>
        </div>
      </section>
    </PageTransition>
  );
}
