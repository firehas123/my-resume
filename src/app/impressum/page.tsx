import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { profile } from "@/lib/profile";
import { PageTransition } from "@/components/motion/PageTransition";

export const metadata: Metadata = { title: "Impressum" };

// The postal address lives in profile.json and is shown on this page only.
export default function ImpressumPage() {
  const address = profile.postalAddress;
  return (
    <PageTransition>
      <LegalPage title="Impressum">
        <h2>Angaben gemäß § 5 DDG</h2>
        <p>
          {profile.name}
          <br />
          {address.street}
          <br />
          {address.postcode} {address.city}
          <br />
          {address.country}
        </p>

        <h2>Kontakt</h2>
        <p>
          Am schnellsten erreichen Sie mich über das{" "}
          <Link href="/contact">Kontaktformular</Link>. Ich antworte per E-Mail.
        </p>

        <h2>Verantwortlich für den Inhalt</h2>
        <p>
          {profile.name}, {address.street}, {address.postcode} {address.city}.
          Dies ist eine private Website mit Lebenslauf und Projekten.
        </p>
      </LegalPage>
    </PageTransition>
  );
}
