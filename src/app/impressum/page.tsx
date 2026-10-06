import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { profile } from "@/lib/profile";
import { PageTransition } from "@/components/motion/PageTransition";

export const metadata: Metadata = { title: "Impressum" };

// Only facts that are known are shown here. What is still missing (a postal
// address) is tracked in TODO.md, never as a marker on the page.
export default function ImpressumPage() {
  return (
    <PageTransition>
      <LegalPage title="Impressum">
        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          {profile.name}
          <br />
          Nürnberg, Deutschland
        </p>

        <h2>Kontakt</h2>
        <p>
          Am schnellsten erreichen Sie mich über das <Link href="/contact">Kontaktformular</Link>. Ich antworte per
          E-Mail.
        </p>

        <h2>Verantwortlich für den Inhalt</h2>
        <p>{profile.name}, Nürnberg, Deutschland. Dies ist eine private Website mit Lebenslauf und Projekten.</p>
      </LegalPage>
    </PageTransition>
  );
}
