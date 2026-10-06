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

      <h2>Reichweitenmessung mit Vercel Web Analytics</h2>
      <p>
        Auf der veröffentlichten Website ist Vercel Web Analytics eingebunden. Es zählt Seitenaufrufe ohne Cookies und
        erfasst dafür unter anderem die aufgerufene Seite, die verweisende Website, das ungefähre Land sowie Gerätetyp,
        Betriebssystem und Browser. Laut Vercel werden Besucher nicht über Websites hinweg verfolgt; zum Zählen
        wird ein kurzlebiger, nicht umkehrbarer Wert aus der Anfrage gebildet, der nach etwa 24 Stunden verworfen
        wird.
      </p>
      <p>
        <strong>TODO:</strong> Angaben mit der aktuellen Datenschutzerklärung von Vercel abgleichen
        (vercel.com/docs/analytics/privacy-policy) und Anbieter, Rechtsgrundlage und Speicherdauer ergänzen.
      </p>

      <h2>Leistungsmessung mit Vercel Speed Insights</h2>
      <p>
        Vercel Speed Insights misst, wie schnell die Seiten laden und reagieren (sogenannte Core Web Vitals), zusammen
        mit der aufgerufenen Seite und allgemeinen Angaben zu Gerät und Browser. Es werden keine Cookies gesetzt.
      </p>
      <p>
        <strong>TODO:</strong> Angaben mit der aktuellen Datenschutzerklärung von Vercel abgleichen
        (vercel.com/docs/speed-insights/privacy-policy) und Rechtsgrundlage ergänzen.
      </p>

      <h2>Eigene Besucherstatistik</h2>
      <p>
        Zusätzlich zählt diese Website ihre Besuche selbst. Gespeichert werden ausschließlich zusammengezählte Zahlen
        in einer Datenbank (Upstash Redis, über Vercel angebunden):
      </p>
      <ul>
        <li>pro Tag: Besuche und Seitenaufrufe,</li>
        <li>pro Tag und Land: Besuche und Seitenaufrufe je zweistelligem Ländercode,</li>
        <li>laufende Gesamtsummen: Besuche, Seitenaufrufe und je Land,</li>
        <li>Seitenaufrufe nach Uhrzeit und Wochentag (deutsche Zeit),</li>
        <li>pro Tag: Aufrufe je Seite der Website,</li>
        <li>pro Tag: Gerätetyp (Smartphone, Tablet, Computer),</li>
        <li>pro Tag: die verweisende Website, nur als Domain (zum Beispiel „linkedin.com“), nie die vollständige Adresse,</li>
        <li>pro Tag: verwendete Farbdarstellung (hell oder dunkel),</li>
        <li>pro Tag: Downloads des Lebenslaufs und Klicks auf LinkedIn, GitHub und „Ask me a question“,</li>
        <li>das Datum, seit dem gezählt wird, und der Zeitpunkt des letzten Seitenaufrufs,</li>
        <li>die letzten 25 Seitenaufrufe, jeweils nur mit Land, Seite und Uhrzeit.</li>
      </ul>
      <p>
        Diese Zahlen werden <strong>ohne zeitliche Begrenzung</strong> aufbewahrt, damit die Statistik alle Tage seit
        Beginn der Zählung abdeckt.
      </p>
      <p>Bewusst nicht gespeichert oder protokolliert werden:</p>
      <ul>
        <li>IP-Adressen, Browserkennungen (User-Agent) oder sonstige Kennungen,</li>
        <li>Städte, Regionen oder Koordinaten (nur das Land),</li>
        <li>Cookies; die Zählung nutzt auch keinen Speicher im Browser,</li>
        <li>Fingerprinting oder seitenübergreifende Verfolgung.</li>
      </ul>
      <p>
        Nicht gezählt werden Besuche, wenn der Browser „Do Not Track“ oder „Global Privacy Control“ sendet, sowie
        Aufrufe durch Suchmaschinen und andere automatisierte Programme. Gezählt wird nur auf der veröffentlichten
        Website, nicht in Vorschauversionen.
      </p>
      <p>
        <strong>TODO:</strong> Rechtsgrundlage für die eigene Besucherstatistik ergänzen.
      </p>

      <h2>Speicherung im Browser</h2>
      <p>Diese Website setzt keine Cookies. Im Browser werden nur diese Einstellungen gespeichert:</p>
      <ul>
        <li>die gewählte Farbdarstellung (hell oder dunkel) im lokalen Speicher (localStorage),</li>
        <li>ob die kurze Eingangsanimation in dieser Sitzung schon gezeigt wurde (sessionStorage),</li>
        <li>
          nur auf dem Gerät des Betreibers: ein Vermerk, dass dessen eigene Besuche nicht mitgezählt werden
          (localStorage).
        </li>
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
