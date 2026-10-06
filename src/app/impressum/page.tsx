import type { Metadata } from "next";
import { LegalPage, TodoNotice } from "@/components/layout/LegalPage";

export const metadata: Metadata = { title: "Impressum" };

// TODO: replace this placeholder with the real Impressum before relying on
// the site professionally. See REVIEW.md.
export default function ImpressumPage() {
  return (
    <LegalPage title="Impressum">
      <TodoNotice>
        <p>
          This page is a placeholder. The legally required details (Angaben gemäß § 5 DDG) have not been filled in
          yet.
        </p>
      </TodoNotice>

      <h2>Angaben gemäß § 5 DDG</h2>
      <p>
        <strong>TODO:</strong> vollständiger Name
      </p>
      <p>
        <strong>TODO:</strong> ladungsfähige Anschrift (Straße, Hausnummer, PLZ, Ort)
      </p>

      <h2>Kontakt</h2>
      <p>
        <strong>TODO:</strong> Kontaktmöglichkeit für eine schnelle, direkte Kommunikation
      </p>

      <h2>Verantwortlich für den Inhalt</h2>
      <p>
        <strong>TODO:</strong> Name und Anschrift (nur nötig, falls journalistisch-redaktionelle Inhalte angeboten
        werden)
      </p>
    </LegalPage>
  );
}
