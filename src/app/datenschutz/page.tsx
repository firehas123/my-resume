import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { profile } from "@/lib/profile";
import { PageTransition } from "@/components/motion/PageTransition";

export const metadata: Metadata = { title: "Datenschutz" };

// Describes what this site actually does. Open points (a professional review)
// are tracked in TODO.md, never as markers on the page.
export default function DatenschutzPage() {
  return (
    <PageTransition>
      <LegalPage title="Datenschutz">
        <h2>Verantwortlicher</h2>
        <p>
          Verantwortlich für die Datenverarbeitung auf dieser Website ist {profile.name}, Nürnberg, Deutschland.
          Kontakt über das <Link href="/contact">Kontaktformular</Link>.
        </p>

        <h2>Hosting</h2>
        <p>
          Die Website wird bei Vercel Inc. (San Francisco, USA) gehostet. Beim Aufruf verarbeitet der Hoster technisch
          notwendige Daten wie IP-Adresse, Zeitpunkt und aufgerufene Seite, um die Website auszuliefern und vor
          Missbrauch zu schützen. Rechtsgrundlage ist das berechtigte Interesse an einer sicheren und zuverlässigen
          Bereitstellung der Website (Art. 6 Abs. 1 lit. f DSGVO).
        </p>

        <h2>Kontaktformular</h2>
        <p>
          Wenn Sie das Kontaktformular nutzen, werden Name, E-Mail-Adresse und Nachricht direkt aus Ihrem Browser an den
          Formulardienst Web3Forms übermittelt, dort verarbeitet und als E-Mail an mein Postfach weitergeleitet. Ihre
          E-Mail-Adresse wird als Antwortadresse gesetzt, damit ich Ihnen antworten kann. Die Angaben verwende ich nur,
          um Ihre Anfrage zu beantworten. Rechtsgrundlage ist Ihre Anfrage selbst (Art. 6 Abs. 1 lit. b und f DSGVO).
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
          Rechtsgrundlage ist das berechtigte Interesse, die Nutzung der Website in zusammengefasster Form zu verstehen
          (Art. 6 Abs. 1 lit. f DSGVO).
        </p>

        <h2>Leistungsmessung mit Vercel Speed Insights</h2>
        <p>
          Vercel Speed Insights misst, wie schnell die Seiten laden und reagieren (sogenannte Core Web Vitals), zusammen
          mit der aufgerufenen Seite und allgemeinen Angaben zu Gerät und Browser. Es werden keine Cookies gesetzt.
        </p>
        <p>
          Rechtsgrundlage ist das berechtigte Interesse an einer schnell ladenden, gut funktionierenden Website
          (Art. 6 Abs. 1 lit. f DSGVO).
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
          Rechtsgrundlage ist das berechtigte Interesse, die Reichweite der Website in zusammengefasster, nicht
          personenbezogener Form zu erfassen (Art. 6 Abs. 1 lit. f DSGVO).
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
          Sie haben das Recht auf Auskunft über Ihre gespeicherten Daten, auf Berichtigung, Löschung und Einschränkung
          der Verarbeitung, auf Widerspruch gegen die Verarbeitung sowie auf Datenübertragbarkeit (Art. 15 bis 21
          DSGVO). Wenden Sie sich dafür über das <Link href="/contact">Kontaktformular</Link> an mich.
        </p>
        <p>
          Außerdem können Sie sich bei einer Datenschutz-Aufsichtsbehörde beschweren, zum Beispiel beim Bayerischen
          Landesamt für Datenschutzaufsicht (BayLDA) in Ansbach.
        </p>
      </LegalPage>
    </PageTransition>
  );
}
