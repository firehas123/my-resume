import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactForm } from "@/components/contact/ContactForm";
import { contactSetup } from "@/lib/contact";
import { languageInfo } from "@/i18n/config";
import { findLink, visibleLinks } from "@/lib/profile";
import { alternates } from "@/lib/seo";
import { trackName } from "@/lib/stats/track";
import styles from "./page.module.css";
import { PageTransition } from "@/components/motion/PageTransition";

export async function generateMetadata({ params }: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: alternates("/contact", locale) };
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  const t = await getTranslations("contact");
  // Server route with my own hCaptcha keys, or Web3Forms (see lib/contact.ts).
  const setup = contactSetup();
  // "LinkedIn and GitHub" / "LinkedIn und GitHub": joined the way the language joins lists.
  const listParts = new Intl.ListFormat(languageInfo(locale).intl, { type: "conjunction" }).formatToParts(
    visibleLinks.map((link) => link.id),
  );

  return (
    <PageTransition>
      <section className={styles.page} aria-labelledby="contact-title">
        <div className={`container ${styles.inner}`}>
          <div className={styles.intro}>
            <h1 id="contact-title" className={styles.title}>
              {t.rich("title", { accent: (chunks) => <span className={styles.accent}>{chunks}</span> })}
            </h1>
            <p className={styles.lead}>{t("lead")}</p>
            {visibleLinks.length > 0 && (
              <p className={styles.links}>
                {/* <links></links> is an empty tag: the function fills in the list of links. */}
                {t.rich("findMe", {
                  links: () =>
                    listParts.map((part, i) => {
                      if (part.type === "literal") return <span key={i}>{part.value}</span>;
                      const link = visibleLinks.find((l) => l.id === part.value)!;
                      return (
                        <a key={i} href={link.url} className="u-link" target="_blank" rel="noopener noreferrer" data-track={trackName(link.id)}>
                          {link.label}
                        </a>
                      );
                    }),
                })}
              </p>
            )}
          </div>
          <div className={styles.formWrap}>
            <ContactForm setup={setup} linkedinUrl={findLink("linkedin")?.url} />
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
