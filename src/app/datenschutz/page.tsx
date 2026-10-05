import type { Metadata } from "next";
import { LegalPage, TodoNotice } from "@/components/layout/LegalPage";

export const metadata: Metadata = { title: "Datenschutz" };

// TODO: replace this placeholder with a reviewed privacy policy. The outline
// below only lists what this site technically does, as a starting point.
export default function DatenschutzPage() {
  return (
    <LegalPage title="Datenschutz">
      <TodoNotice>
        <p>
          This page is a placeholder, not a finished privacy policy. The outline below lists what this website
          technically does, as a starting point. It must be completed and checked before relying on it.
        </p>
      </TodoNotice>

      <h2>Verantwortlicher</h2>
      <p>
        <strong>TODO:</strong> Name und Anschrift des Verantwortlichen
      </p>

      <h2>Hosting</h2>
      <p>
        <strong>TODO:</strong> Die Website wird bei Vercel Inc. gehostet. Beim Aufruf verarbeitet der Hoster
        technisch notwendige Daten (z. B. IP-Adresse, Zeitpunkt, aufgerufene Seite). Angaben zum Hoster, zur
        Rechtsgrundlage und zur Speicherdauer ergänzen.
      </p>

      <h2>Kontaktformular</h2>
      <p>
        <strong>TODO:</strong> Das Kontaktformular sendet Name, E-Mail-Adresse und Nachricht an einen externen
        Formulardienst. Anbieter, Zweck, Rechtsgrundlage und Speicherdauer ergänzen, sobald der Dienst gewählt ist.
      </p>

      <h2>Speicherung im Browser</h2>
      <p>Diese Website setzt keine Cookies und verwendet keine Analyse- oder Tracking-Dienste. Im Browser werden nur zwei Einstellungen gespeichert:</p>
      <ul>
        <li>die gewählte Farbdarstellung (hell oder dunkel) im lokalen Speicher (localStorage),</li>
        <li>ob die kurze Eingangsanimation in dieser Sitzung schon gezeigt wurde (sessionStorage).</li>
      </ul>

      <h2>Schriftarten</h2>
      <p>
        Die Schriftart wird von dieser Website selbst ausgeliefert. Beim Aufruf werden keine Verbindungen zu Google
        oder anderen Schriftanbietern aufgebaut.
      </p>

      <h2>Externe Links</h2>
      <p>
        Links zu LinkedIn und GitHub führen zu externen Angeboten. Erst beim Anklicken gelten deren
        Datenschutzbestimmungen.
      </p>

      <h2>Ihre Rechte</h2>
      <p>
        <strong>TODO:</strong> Hinweise auf Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch,
        Datenübertragbarkeit und Beschwerderecht bei einer Aufsichtsbehörde ergänzen.
      </p>
    </LegalPage>
  );
}
