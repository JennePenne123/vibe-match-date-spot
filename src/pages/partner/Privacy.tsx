import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';

/**
 * Partner-Datenschutzerklärung – DSGVO-konform
 * Rechtsform: HiOutz GmbH (i. Gr.)
 */
export default function PartnerPrivacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Partner-Datenschutzerklärung
            </h1>
          </div>
        </div>

        <div className="px-4 py-6 prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground text-xs">
            Stand: März 2026 · HiOutz GmbH (i.&nbsp;Gr.)
          </p>

          <h2>1. Verantwortlicher</h2>
          <p className="text-muted-foreground">
            Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
          </p>
          <p className="text-muted-foreground">
            HiOutz GmbH (i.&nbsp;Gr.)<br />
            [Straße und Hausnummer]<br />
            [PLZ] [Ort], Deutschland<br />
            E-Mail: datenschutz@hioutz.app
          </p>
          <p className="text-muted-foreground">
            Diese Datenschutzerklärung gilt speziell für Venue-Partner, die die Partner-Plattform
            der App „HiOutz" nutzen. Für Endnutzer gilt die{' '}
            <a href="/datenschutz" className="text-primary">allgemeine Datenschutzerklärung</a>.
          </p>

          <h2>2. Rechtsgrundlagen der Verarbeitung</h2>
          <p className="text-muted-foreground">
            Wir verarbeiten personenbezogene Daten des Partners auf folgenden Rechtsgrundlagen
            gemäß Art.&nbsp;6 Abs.&nbsp;1 DSGVO:
          </p>
          <ul className="text-muted-foreground">
            <li><strong>Vertragserfüllung (lit.&nbsp;b):</strong> Bereitstellung der Partner-Plattform, Venue-Management, Voucher-System, Verifizierung, Abrechnung</li>
            <li><strong>Berechtigte Interessen (lit.&nbsp;f):</strong> Betrugsprävention, Plattformsicherheit, Qualitätssicherung der KI-Empfehlungen, aggregierte Analytics</li>
            <li><strong>Rechtliche Verpflichtung (lit.&nbsp;c):</strong> Steuerliche und handelsrechtliche Aufbewahrungspflichten, USt-IdNr.-Prüfung</li>
            <li><strong>Einwilligung (lit.&nbsp;a):</strong> Push-Benachrichtigungen, Newsletter, optionale Analytics-Erweiterungen</li>
          </ul>

          <h2>3. Erhobene Daten</h2>
          <h3>3.1 Registrierungsdaten</h3>
          <ul className="text-muted-foreground">
            <li>Firmenname / Geschäftsbezeichnung</li>
            <li>Name der Kontaktperson</li>
            <li>Geschäftliche E-Mail-Adresse</li>
            <li>Telefonnummer (optional)</li>
            <li>Geschäftsadresse (Straße, PLZ, Ort, Land)</li>
            <li>Website-URL (optional)</li>
          </ul>

          <h3>3.2 Verifizierungsdaten</h3>
          <ul className="text-muted-foreground">
            <li>Umsatzsteuer-Identifikationsnummer (USt-IdNr.) und/oder Steuernummer</li>
            <li>Verifizierungsstatus und -methode</li>
            <li>Zeitstempel der Verifizierung</li>
          </ul>
          <p className="text-muted-foreground">
            Die USt-IdNr. wird über das VIES-System der Europäischen Kommission automatisiert geprüft.
            Dabei wird ausschließlich die Gültigkeit der Nummer abgefragt; es werden keine weiteren
            Daten an VIES übermittelt.
          </p>

          <h3>3.3 Venue-Daten</h3>
          <ul className="text-muted-foreground">
            <li>Venue-Name, Beschreibung und Kategorie</li>
            <li>Adresse und Geodaten (Breitengrad, Längengrad)</li>
            <li>Öffnungszeiten und Best-Time-Angaben</li>
            <li>Fotos und Logo</li>
            <li>KI-Profildaten (Vibe-Tags, Photo-Vibe-Scores, Personality-Wizard-Einstellungen)</li>
            <li>Saisonale Specials und Sonderangebote</li>
          </ul>

          <h3>3.4 Transaktions- und Nutzungsdaten</h3>
          <ul className="text-muted-foreground">
            <li>Erstellte Voucher (Typ, Wert, Gültigkeitsdauer, Einlösungsstatus)</li>
            <li>Mitgliedschaftsstatus und -historie (Free/Pro)</li>
            <li>Dashboard-Zugriffe und Nutzungsmuster</li>
            <li>Partner-Netzwerk-Interaktionen (QR-Code-Scans)</li>
          </ul>

          <h3>3.5 Aggregierte Endnutzer-Daten</h3>
          <p className="text-muted-foreground">
            Partner erhalten Zugang zu aggregierten und anonymisierten Feedback-Daten:
          </p>
          <ul className="text-muted-foreground">
            <li>Durchschnittliche Venue-Bewertungen</li>
            <li>Besuchsfrequenz-Trends</li>
            <li>Voucher-Einlösungsraten</li>
            <li>Matching-Score-Statistiken</li>
          </ul>
          <p className="text-muted-foreground">
            Es werden dem Partner zu keinem Zeitpunkt individuelle, identifizierbare Endnutzer-Daten
            zugänglich gemacht.
          </p>

          <h2>4. Zweck der Datenverarbeitung</h2>
          <ul className="text-muted-foreground">
            <li>Durchführung des Partnervertrags und Bereitstellung der Plattform</li>
            <li>Verifizierung der Geschäftslegitimation</li>
            <li>Abrechnung von Pro-Mitgliedschaften</li>
            <li>Bereitstellung des Analytics-Dashboards</li>
            <li>KI-gestütztes Matching zwischen Venues und Endnutzern</li>
            <li>Betrugsprävention und Qualitätssicherung</li>
            <li>Einhaltung gesetzlicher Pflichten (Steuerrecht, Handelsrecht)</li>
            <li>Verbesserung der Plattform und der KI-Algorithmen</li>
          </ul>

          <h2>5. Datenempfänger und Auftragsverarbeiter</h2>
          <table className="text-muted-foreground text-xs">
            <thead>
              <tr>
                <th className="text-left pr-3">Dienst</th>
                <th className="text-left pr-3">Anbieter</th>
                <th className="text-left pr-3">Zweck</th>
                <th className="text-left">Standort</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pr-3 py-1">Supabase</td>
                <td className="pr-3 py-1">Supabase Inc., USA</td>
                <td className="pr-3 py-1">Datenbank, Auth, Edge Functions</td>
                <td className="py-1">EU (Frankfurt)</td>
              </tr>
              <tr>
                <td className="pr-3 py-1">Sentry</td>
                <td className="pr-3 py-1">Functional Software Inc., USA</td>
                <td className="pr-3 py-1">Fehlermonitoring</td>
                <td className="py-1">EU</td>
              </tr>
              <tr>
                <td className="pr-3 py-1">VIES</td>
                <td className="pr-3 py-1">Europäische Kommission</td>
                <td className="pr-3 py-1">USt-IdNr.-Validierung</td>
                <td className="py-1">EU</td>
              </tr>
              <tr>
                <td className="pr-3 py-1">Stripe (geplant)</td>
                <td className="pr-3 py-1">Stripe Payments Europe Ltd., Irland</td>
                <td className="pr-3 py-1">Zahlungsabwicklung</td>
                <td className="py-1">EU</td>
              </tr>
            </tbody>
          </table>
          <p className="text-muted-foreground mt-3">
            Soweit Daten an Empfänger in den USA übermittelt werden, erfolgt dies auf Grundlage des
            EU-US Data Privacy Frameworks (Angemessenheitsbeschluss, Art.&nbsp;45 DSGVO) oder auf Basis
            von Standardvertragsklauseln (Art.&nbsp;46 Abs.&nbsp;2 lit.&nbsp;c DSGVO).
          </p>

          <h2>6. Datenübermittlung in Drittländer</h2>
          <p className="text-muted-foreground">
            Unsere primäre Datenverarbeitung erfolgt auf Servern innerhalb der Europäischen Union
            (Supabase-Projekt in Frankfurt/Main). Soweit eine Datenübermittlung in die USA stattfindet
            (Sentry, Supabase Inc. als Muttergesellschaft), gelten folgende Schutzmaßnahmen:
          </p>
          <ul className="text-muted-foreground">
            <li>EU-US Data Privacy Framework (Angemessenheitsbeschluss der EU-Kommission vom 10.07.2023)</li>
            <li>Standardvertragsklauseln (SCC) gemäß Art.&nbsp;46 Abs.&nbsp;2 lit.&nbsp;c DSGVO</li>
            <li>Technische Schutzmaßnahmen (TLS-Verschlüsselung, Pseudonymisierung)</li>
          </ul>

          <h2>7. Speicherdauer</h2>
          <ul className="text-muted-foreground">
            <li><strong>Registrierungs- und Vertragsdaten:</strong> Dauer des Vertragsverhältnisses + gesetzliche Aufbewahrungsfristen</li>
            <li><strong>Verifizierungsdaten:</strong> Dauer des Vertragsverhältnisses + 3 Jahre (Beweissicherung)</li>
            <li><strong>Steuer- und Abrechnungsdaten:</strong> 10 Jahre (§ 147 AO, § 257 HGB)</li>
            <li><strong>Voucher-Transaktionsdaten:</strong> 10 Jahre (steuerliche Aufbewahrungspflicht)</li>
            <li><strong>Dashboard-Nutzungsdaten:</strong> 12 Monate, dann automatische Löschung</li>
            <li><strong>Fehlerprotokolle:</strong> 90 Tage</li>
            <li><strong>Venue-Daten:</strong> 30 Tage nach Vertragsbeendigung (es sei denn, aktive Voucher bestehen noch)</li>
          </ul>

          <h2>8. Automatisierte Entscheidungsfindung und KI</h2>
          <p className="text-muted-foreground">
            (1) Die Plattform nutzt KI-Algorithmen, um Venues mit Endnutzern zu matchen. Die
            KI-Verarbeitung basiert auf:
          </p>
          <ul className="text-muted-foreground">
            <li>Venue-Profildaten (Tags, Kategorie, Vibe, Preisklasse)</li>
            <li>Aggregierten Endnutzer-Präferenzen (keine individuellen Daten)</li>
            <li>Aggregiertem Feedback-Scoring</li>
            <li>Kontextdaten (Tageszeit, Wetter, Saison)</li>
          </ul>
          <p className="text-muted-foreground">
            (2) Es werden keine automatisierten Entscheidungen mit rechtlicher oder ähnlich erheblicher
            Wirkung für den Partner getroffen (Art.&nbsp;22 DSGVO). Matching-Scores und Rankings sind
            technische Empfehlungen, die keinen Einfluss auf das Vertragsverhältnis haben.
          </p>
          <p className="text-muted-foreground">
            (3) Der Partner kann die KI-Optimierungsvorschläge im Dashboard jederzeit einsehen und
            hat die volle Kontrolle über sein Venue-Profil und die dargestellten Informationen.
          </p>

          <h2>9. Betroffenenrechte</h2>
          <p className="text-muted-foreground">
            Als Partner haben Sie gegenüber uns folgende Rechte:
          </p>
          <ul className="text-muted-foreground">
            <li><strong>Auskunftsrecht</strong> (Art.&nbsp;15 DSGVO) – Auskunft über die verarbeiteten Daten</li>
            <li><strong>Berichtigungsrecht</strong> (Art.&nbsp;16 DSGVO) – Korrektur unrichtiger Daten</li>
            <li><strong>Löschungsrecht</strong> (Art.&nbsp;17 DSGVO) – Löschung unter den gesetzlichen Voraussetzungen</li>
            <li><strong>Einschränkung der Verarbeitung</strong> (Art.&nbsp;18 DSGVO)</li>
            <li><strong>Datenübertragbarkeit</strong> (Art.&nbsp;20 DSGVO) – Export in maschinenlesbarem Format</li>
            <li><strong>Widerspruchsrecht</strong> (Art.&nbsp;21 DSGVO) – gegen Verarbeitung auf Basis berechtigter Interessen</li>
            <li><strong>Widerruf von Einwilligungen</strong> (Art.&nbsp;7 Abs.&nbsp;3 DSGVO) – ohne Auswirkung auf die Rechtmäßigkeit der bisherigen Verarbeitung</li>
            <li><strong>Beschwerderecht</strong> (Art.&nbsp;77 DSGVO) – bei der zuständigen Aufsichtsbehörde</li>
          </ul>
          <p className="text-muted-foreground">
            Zuständige Aufsichtsbehörde ist der Landesbeauftragte für Datenschutz und Informationsfreiheit
            des jeweiligen Bundeslandes. Anfragen richten Sie bitte an:{' '}
            <a href="mailto:datenschutz@hioutz.app" className="text-primary">datenschutz@hioutz.app</a>.
          </p>

          <h2>10. Cookies und lokale Speicherung</h2>
          <p className="text-muted-foreground">
            Die Partner-Plattform verwendet:
          </p>
          <ul className="text-muted-foreground">
            <li><strong>Technisch notwendige Cookies:</strong> Session-Management, Authentifizierung (Rechtsgrundlage: § 25 Abs.&nbsp;2 TDDDG)</li>
            <li><strong>LocalStorage:</strong> Spracheinstellungen, UI-Präferenzen (kein Tracking)</li>
          </ul>
          <p className="text-muted-foreground">
            Es werden keine Tracking-Cookies oder Werbe-Cookies eingesetzt. Eine Einwilligung über ein
            Cookie-Banner ist daher nicht erforderlich.
          </p>

          <h2>11. Datensicherheit</h2>
          <p className="text-muted-foreground">
            Wir setzen folgende technische und organisatorische Maßnahmen (TOM) gemäß Art.&nbsp;32 DSGVO ein:
          </p>
          <ul className="text-muted-foreground">
            <li>TLS-Verschlüsselung für alle Datenübertragungen</li>
            <li>Row-Level Security (RLS) auf Datenbankebene – Partner sehen nur eigene Daten</li>
            <li>Passwort-Hashing (bcrypt via Supabase Auth)</li>
            <li>Rate Limiting und Abuse-Erkennung auf API-Ebene</li>
            <li>Input-Sanitization und XSS-Schutz</li>
            <li>Regelmäßige Sicherheitsaudits und Penetrationstests</li>
          </ul>

          <h2>12. Auftragsverarbeitungsvertrag (AVV)</h2>
          <p className="text-muted-foreground">
            Soweit zwischen dem Betreiber und dem Partner eine Auftragsverarbeitung im Sinne des
            Art.&nbsp;28 DSGVO stattfindet, wird ein separater AVV geschlossen. Dieser regelt insbesondere:
          </p>
          <ul className="text-muted-foreground">
            <li>Gegenstand und Dauer der Verarbeitung</li>
            <li>Art und Zweck der Verarbeitung</li>
            <li>Art der personenbezogenen Daten und Kategorien betroffener Personen</li>
            <li>Pflichten und Rechte des Verantwortlichen</li>
            <li>Technische und organisatorische Maßnahmen</li>
          </ul>
          <p className="text-muted-foreground">
            Der AVV ist auf Anfrage unter{' '}
            <a href="mailto:datenschutz@hioutz.app" className="text-primary">datenschutz@hioutz.app</a>{' '}
            erhältlich.
          </p>

          <h2>13. Änderungen dieser Datenschutzerklärung</h2>
          <p className="text-muted-foreground">
            (1) Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen, z.&nbsp;B. bei
            Änderungen der Rechtslage, neuen Diensten oder geänderten Verarbeitungsprozessen.
          </p>
          <p className="text-muted-foreground">
            (2) Änderungen werden per E-Mail und über eine Benachrichtigung im Partner-Dashboard
            mitgeteilt. Die jeweils aktuelle Version ist in der Plattform abrufbar und mit einem
            Versionsdatum versehen.
          </p>

          <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground italic">
              ⚠️ Hinweis: Diese Datenschutzerklärung wurde mit größter Sorgfalt erstellt, ersetzt aber keine
              individuelle Rechtsberatung. Platzhalter in eckigen Klammern müssen durch die tatsächlichen
              Unternehmensdaten ersetzt werden. Bitte vor Veröffentlichung von einem Datenschutzbeauftragten
              oder Rechtsanwalt prüfen lassen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
