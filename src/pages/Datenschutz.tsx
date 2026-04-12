import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield } from 'lucide-react';

export default function Datenschutz() {
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
              Datenschutzerklärung
            </h1>
          </div>
        </div>

        <div className="px-4 py-6 prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground text-xs">Stand: März 2026</p>

          <h2>1. Datenschutz auf einen Blick</h2>
          <p className="text-muted-foreground">
            Die folgenden Hinweise geben einen Überblick darüber, was mit Ihren personenbezogenen Daten passiert,
            wenn Sie die App „HiOutz" (nachfolgend „App" oder „Dienst") nutzen. Verantwortlicher im Sinne der
            Datenschutz-Grundverordnung (DSGVO) ist:
          </p>
          <p className="text-muted-foreground">
            VybePulse GmbH (i.&nbsp;Gr.)<br />
            [Straße und Hausnummer]<br />
            [PLZ] [Ort], Deutschland<br />
            E-Mail: datenschutz@dzeng.app
          </p>

          <h2>2. Rechtsgrundlagen der Verarbeitung</h2>
          <p className="text-muted-foreground">
            Wir verarbeiten personenbezogene Daten nur auf Grundlage einer gültigen Rechtsgrundlage gemäß Art.&nbsp;6 Abs.&nbsp;1 DSGVO:
          </p>
          <ul className="text-muted-foreground">
            <li><strong>Einwilligung (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;a DSGVO):</strong> z.&nbsp;B. Push-Benachrichtigungen, Standortzugriff.</li>
            <li><strong>Vertragserfüllung (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b DSGVO):</strong> Bereitstellung des Dienstes, Verwaltung des Nutzerkontos, Abwicklung von Premium-Mitgliedschaften.</li>
            <li><strong>Berechtigtes Interesse (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO):</strong> Fehlerbehebung, Sicherheit, Betrugsprävention, Verbesserung der KI-Empfehlungen.</li>
            <li><strong>Rechtliche Verpflichtung (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;c DSGVO):</strong> steuerliche und handelsrechtliche Aufbewahrungspflichten.</li>
          </ul>

          <h2>3. Datenerfassung beim Besuch und bei der Registrierung</h2>
          <h3>3.1 Account-Daten</h3>
          <p className="text-muted-foreground">
            Bei der Registrierung per E-Mail und Passwort erfassen wir:
          </p>
          <ul className="text-muted-foreground">
            <li>E-Mail-Adresse</li>
            <li>Selbstgewählter Anzeigename</li>
            <li>Profilbild (optional)</li>
          </ul>
          <p className="text-muted-foreground">
            Die Verarbeitung erfolgt zur Vertragserfüllung (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b DSGVO).
          </p>

          <h3>3.2 Anmeldung über Google</h3>
          <p className="text-muted-foreground">
            Sie können sich mit Ihrem Google-Konto anmelden. Dabei wird ein OAuth-2.0-Verfahren durchgeführt.
            Wir erhalten von Google folgende Daten:
          </p>
          <ul className="text-muted-foreground">
            <li>Google-Benutzer-ID (Sub-Claim)</li>
            <li>E-Mail-Adresse</li>
            <li>Name und Profilbild</li>
          </ul>
          <p className="text-muted-foreground">
            Rechtsgrundlage ist Ihre Einwilligung (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;a DSGVO), die Sie durch Klick auf
            „Mit Google anmelden" erteilen. Die Einwilligung kann jederzeit in den Google-Kontoeinstellungen
            (
            <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary">
              myaccount.google.com/permissions
            </a>
            ) widerrufen werden. Anbieter: Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland.
            Datenschutzerklärung:{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary">
              policies.google.com/privacy
            </a>.
          </p>

          <h3>3.3 Anmeldung über Apple</h3>
          <p className="text-muted-foreground">
            Sie können sich mit Ihrem Apple-Konto anmelden („Sign in with Apple"). Dabei wird ein OAuth-2.0-Verfahren
            durchgeführt. Wir erhalten von Apple:
          </p>
          <ul className="text-muted-foreground">
            <li>Apple-Benutzer-ID</li>
            <li>E-Mail-Adresse (optional von Apple anonymisiert als Relay-Adresse bereitgestellt)</li>
            <li>Name (nur beim erstmaligen Login übertragen)</li>
          </ul>
          <p className="text-muted-foreground">
            Rechtsgrundlage ist Ihre Einwilligung (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;a DSGVO). Apple ermöglicht es,
            die eigene E-Mail-Adresse zu verbergen. In diesem Fall wird eine private Relay-Adresse
            von Apple verwendet. Die Einwilligung kann jederzeit in den Apple-ID-Einstellungen unter
            „Mit Apple anmelden" widerrufen werden. Anbieter: Apple Distribution International Ltd.,
            Hollyhill Industrial Estate, Cork, Irland.
            Datenschutzerklärung:{' '}
            <a href="https://www.apple.com/legal/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary">
              apple.com/legal/privacy
            </a>.
          </p>

          <h3>3.4 Passwort-Sicherheit</h3>
          <p className="text-muted-foreground">
            Bei der Registrierung per E-Mail prüfen wir Ihr Passwort gegen die „Have I Been Pwned"-Datenbank
            (HIBP-Check), um zu erkennen, ob es in bekannten Datenlecks vorkommt. Dabei wird ein partieller
            SHA-1-Hash (k-Anonymity-Verfahren) an den HIBP-Dienst übermittelt – Ihr Klartext-Passwort wird
            niemals übertragen.
          </p>

          <h2>4. Präferenzen und Nutzungsdaten</h2>
          <h3>4.1 Explizite Präferenzen</h3>
          <p className="text-muted-foreground">
            Sie geben freiwillig Präferenzen an, um personalisierte Empfehlungen zu erhalten:
          </p>
          <ul className="text-muted-foreground">
            <li>Bevorzugte Küchen, Vibes, Zeiten, Preisklassen</li>
            <li>Ernährungseinschränkungen und Barrierefreiheitsbedürfnisse</li>
            <li>Beziehungsziel und Persönlichkeitsdaten</li>
            <li>Heimadresse / maximaler Suchradius</li>
          </ul>
          <p className="text-muted-foreground">
            Rechtsgrundlage: Vertragserfüllung (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b DSGVO).
          </p>

          <h3>4.2 Implizite Nutzungssignale</h3>
          <p className="text-muted-foreground">
            Zur Verbesserung der KI-Empfehlungen erfassen wir pseudonymisiert folgende Verhaltensdaten:
          </p>
          <ul className="text-muted-foreground">
            <li>Verweildauer auf Venue-Detailseiten</li>
            <li>Scrolltiefe</li>
            <li>Wiederholte Besuche derselben Venue</li>
            <li>Voucher-Interaktionen (Klick als Preissensitivitäts-Signal)</li>
            <li>Nutzungszeiten (Tageszeit-Muster)</li>
          </ul>
          <p className="text-muted-foreground">
            Rechtsgrundlage: Berechtigtes Interesse (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO) an der Verbesserung
            der Empfehlungsqualität.
          </p>
          <p className="text-muted-foreground">
            <strong>Widerspruchsrecht (Art.&nbsp;21 DSGVO):</strong> Sie können die Erfassung impliziter Signale
            jederzeit in den App-Einstellungen unter „Datenschutz & Tracking" deaktivieren. Bereits erfasste Daten
            werden nach Deaktivierung nicht mehr für zukünftige Empfehlungen herangezogen.
          </p>

          <h3>4.3 Gamification-Daten</h3>
          <p className="text-muted-foreground">
            Punkte, Level, Badges, Streaks und Reward-Einlösungen werden gespeichert, um das Gamification-System
            bereitzustellen (Rechtsgrundlage: Vertragserfüllung).
          </p>

          <h2>5. Standortdaten</h2>
          <p className="text-muted-foreground">
            Die App kann Ihren aktuellen Standort per Geolocation-API Ihres Browsers/Geräts ermitteln, um nahegelegene
            Venues anzuzeigen und Entfernungen zu berechnen. Die Standortfreigabe erfolgt ausschließlich nach Ihrer
            ausdrücklichen Einwilligung (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;a DSGVO) über den systemeigenen
            Berechtigungsdialog. Sie können die Berechtigung jederzeit in Ihren Geräte- oder Browsereinstellungen
            widerrufen.
          </p>

          <h2>6. KI-gestützte Verarbeitung und automatisierte Entscheidungsfindung</h2>
          <p className="text-muted-foreground">
            HiOutz verwendet KI-Algorithmen zur Berechnung von:
          </p>
          <ul className="text-muted-foreground">
            <li>Venue-Matching-Scores und personalisierten Empfehlungen</li>
            <li>Kompatibilitätswerten zwischen zwei Nutzern</li>
            <li>Adaptiven Gewichtungen basierend auf Ihrem Feedback</li>
          </ul>
          <p className="text-muted-foreground">
            Die Venue-Matching-Scores und Kompatibilitätswerte werden lokal in unserer eigenen Infrastruktur
            (Supabase Edge Functions) berechnet. Für bestimmte Zusatzfunktionen – wie KI-generierte
            Date-Ideen, Einladungstexte und den Concierge-Chat – nutzen wir den <strong>Lovable AI Gateway</strong>,
            einen KI-Textgenerierungsdienst (siehe Abschnitt&nbsp;7). Dabei werden ausschließlich anonymisierte
            Präferenzdaten (z.&nbsp;B. bevorzugte Küchen, Stimmungen) übermittelt – <strong>keine
            persönlich identifizierbaren Daten</strong> wie Name, E-Mail oder Standort.
          </p>
          <p className="text-muted-foreground">
            Rechtsgrundlage: Vertragserfüllung (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b DSGVO).
          </p>
          <p className="text-muted-foreground">
            <strong>Kein Profiling im Sinne des Art.&nbsp;22 DSGVO:</strong> Die KI-Ergebnisse dienen ausschließlich
            als Vorschläge und erzeugen keine rechtliche oder ähnlich erhebliche Wirkung. Sie treffen die finale
            Entscheidung über Venue-Auswahl und Date-Planung stets selbst.
          </p>
          <p className="text-muted-foreground">
            Sie können die Lernhistorie der KI jederzeit in Ihrem Profil einsehen und in den Einstellungen
            zurücksetzen.
          </p>

          <h2>7. Externe Dienste und Auftragsverarbeiter</h2>
          <table className="text-muted-foreground text-xs">
            <thead>
              <tr>
                <th className="text-left pr-3">Dienst</th>
                <th className="text-left pr-3">Anbieter</th>
                <th className="text-left pr-3">Zweck</th>
                <th className="text-left">Serverstandort</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="pr-3 py-1">Supabase</td>
                <td className="pr-3 py-1">Supabase Inc., USA</td>
                <td className="pr-3 py-1">Authentifizierung, Datenbank, Edge Functions</td>
                <td className="py-1">EU (Frankfurt)</td>
              </tr>
              <tr>
                <td className="pr-3 py-1">Sentry</td>
                <td className="pr-3 py-1">Functional Software Inc., USA</td>
                <td className="pr-3 py-1">Fehlererkennung, Performance-Monitoring</td>
                <td className="py-1">EU</td>
              </tr>
              <tr>
                <td className="pr-3 py-1">Google OAuth</td>
                <td className="pr-3 py-1">Google Ireland Ltd., Irland</td>
                <td className="pr-3 py-1">Social Login</td>
                <td className="py-1">EU/USA</td>
              </tr>
              <tr>
                <td className="pr-3 py-1">Apple Sign-In</td>
                <td className="pr-3 py-1">Apple Distribution Intl. Ltd., Irland</td>
                <td className="pr-3 py-1">Social Login</td>
                <td className="py-1">EU/USA</td>
              </tr>
              <tr>
                <td className="pr-3 py-1">OpenStreetMap / Overpass API</td>
                <td className="pr-3 py-1">OpenStreetMap Foundation, UK</td>
                <td className="pr-3 py-1">Venue-Suche, Kartendaten</td>
                <td className="py-1">EU</td>
              </tr>
              <tr>
                <td className="pr-3 py-1">Foursquare Places API</td>
                <td className="pr-3 py-1">Foursquare Labs Inc., USA</td>
                <td className="pr-3 py-1">Venue-Fotos, Bewertungen, Kategorien</td>
                <td className="py-1">USA</td>
              </tr>
              <tr>
                <td className="pr-3 py-1">Radar</td>
                <td className="pr-3 py-1">Radar Labs Inc., USA</td>
                <td className="pr-3 py-1">Venue-Daten</td>
                <td className="py-1">USA</td>
              </tr>
              <tr>
                <td className="pr-3 py-1">Lovable AI Gateway</td>
                <td className="pr-3 py-1">Lovable (Supabase AI Gateway)</td>
                <td className="pr-3 py-1">KI-gestützte Textgenerierung (Date-Ideen, Einladungstexte, Concierge)</td>
                <td className="py-1">EU/USA</td>
              </tr>
              <tr>
                <td className="pr-3 py-1">Open-Meteo</td>
                <td className="pr-3 py-1">Open-Meteo, Schweiz</td>
                <td className="pr-3 py-1">Wetterdaten für Empfehlungen</td>
                <td className="py-1">EU</td>
              </tr>
            </tbody>
          </table>
          <p className="text-muted-foreground mt-3">
            Soweit Daten an Empfänger in den USA übermittelt werden, erfolgt dies auf Grundlage des EU-US
            Data Privacy Frameworks (Angemessenheitsbeschluss der EU-Kommission, Art.&nbsp;45 DSGVO) oder
            auf Basis von Standardvertragsklauseln (Art.&nbsp;46 Abs.&nbsp;2 lit.&nbsp;c DSGVO).
          </p>

          <h3>7.1 Sentry (Fehlermonitoring)</h3>
          <p className="text-muted-foreground">
            Bei Fehlern werden technische Daten (Fehlermeldung, Stack-Trace, Browser, Betriebssystem) sowie eine
            anonymisierte Session-Aufzeichnung übermittelt. Texteingaben werden dabei maskiert, Medieninhalte
            blockiert. Rechtsgrundlage: berechtigtes Interesse (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO).
          </p>

          <h2>8. Mitarbeiterverwaltung für Venue-Partner</h2>
          <p className="text-muted-foreground">
            Venue-Partner können Mitarbeiter über die App einladen und verwalten. Im Rahmen der Mitarbeiterverwaltung
            werden folgende Daten verarbeitet:
          </p>
          <ul className="text-muted-foreground">
            <li><strong>E-Mail-Adresse</strong> des eingeladenen Mitarbeiters (zur Einladung und Kontozuordnung)</li>
            <li><strong>Name</strong> des Mitarbeiters</li>
            <li><strong>Rolle</strong> innerhalb des Betriebs (z.&nbsp;B. Manager oder Mitarbeiter)</li>
            <li><strong>Individueller QR-Code-Token</strong> – ein pseudonymisierter, zufällig generierter Identifikator
              zur eindeutigen Zuordnung bei der Voucher-Einlösung</li>
            <li><strong>Zeitstempel des letzten Scans</strong> zur betrieblichen Nachvollziehbarkeit</li>
          </ul>
          <p className="text-muted-foreground">
            <strong>Onboarding per QR-Code:</strong> Mitarbeiter können alternativ zur E-Mail-Einladung auch einen
            vom Partner bereitgestellten QR-Code scannen, um sich dem Betrieb zuzuordnen. Dabei wird lediglich
            ein tokenisierter Link verarbeitet – es werden keine zusätzlichen personenbezogenen Daten erhoben.
          </p>
          <p className="text-muted-foreground">
            Rechtsgrundlage: Vertragserfüllung (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b DSGVO) zwischen dem Partner
            und seinem Mitarbeiter bzw. berechtigtes Interesse (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;f DSGVO) an der
            betrieblichen Organisation der Voucher-Einlösung. Mitarbeiter können ihre Zuordnung jederzeit
            über den Partner oder durch Kontolöschung aufheben.
          </p>

          <h2>9. Push-Benachrichtigungen</h2>
          <p className="text-muted-foreground">
            Sie können Push-Benachrichtigungen aktivieren (z.&nbsp;B. Date-Erinnerungen, Einladungsstatus).
            Die Aktivierung erfolgt ausschließlich auf Ihre ausdrückliche Einwilligung (Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;a DSGVO).
            Die Einwilligung kann jederzeit in den App-Einstellungen oder über die Browsereinstellungen
            widerrufen werden. Wir speichern dazu Push-Subscription-Daten (Endpoint, Keys) auf unseren Servern.
          </p>

          <h2>10. Speicherdauer</h2>
          <ul className="text-muted-foreground">
            <li><strong>Account-Daten:</strong> Bis zur Kontolöschung durch den Nutzer.</li>
            <li><strong>Nutzungsdaten und Präferenzen:</strong> Bis zur Kontolöschung oder Widerruf.</li>
            <li><strong>Implizite Signale:</strong> Max. 12 Monate, danach automatische Löschung.</li>
            <li><strong>Fehlerprotokolle (Sentry):</strong> 90 Tage.</li>
            <li><strong>Abrechnungsdaten:</strong> 10 Jahre (gesetzliche Aufbewahrungspflicht).</li>
          </ul>

          <h2>11. Ihre Rechte nach der DSGVO</h2>
          <p className="text-muted-foreground">
            Sie haben gegenüber uns folgende Rechte hinsichtlich Ihrer personenbezogenen Daten:
          </p>
          <ul className="text-muted-foreground">
            <li><strong>Recht auf Auskunft</strong> (Art.&nbsp;15 DSGVO)</li>
            <li><strong>Recht auf Berichtigung</strong> (Art.&nbsp;16 DSGVO)</li>
            <li><strong>Recht auf Löschung</strong> (Art.&nbsp;17 DSGVO)</li>
            <li><strong>Recht auf Einschränkung der Verarbeitung</strong> (Art.&nbsp;18 DSGVO)</li>
            <li><strong>Recht auf Datenübertragbarkeit</strong> (Art.&nbsp;20 DSGVO)</li>
            <li><strong>Widerspruchsrecht</strong> (Art.&nbsp;21 DSGVO)</li>
            <li><strong>Recht auf Widerruf erteilter Einwilligungen</strong> (Art.&nbsp;7 Abs.&nbsp;3 DSGVO) – ohne Auswirkung auf die Rechtmäßigkeit der bisherigen Verarbeitung.</li>
            <li><strong>Recht auf Beschwerde</strong> bei einer Aufsichtsbehörde (Art.&nbsp;77 DSGVO)</li>
          </ul>
          <p className="text-muted-foreground">
            Die zuständige Aufsichtsbehörde ist der Landesbeauftragte für Datenschutz und Informationsfreiheit
            des jeweiligen Bundeslandes. Sie erreichen uns unter:{' '}
            <a href="mailto:datenschutz@dzeng.app" className="text-primary">datenschutz@dzeng.app</a>.
          </p>

          <h2>12. Datenlöschung und Datenexport</h2>
          <p className="text-muted-foreground">
            Sie können Ihr Konto und alle damit verbundenen Daten jederzeit in den Einstellungen löschen.
            Eine Datenexport-Funktion (Art.&nbsp;20 DSGVO) steht ebenfalls in den Einstellungen zur Verfügung.
            Bei der Kontolöschung werden sämtliche personenbezogenen Daten innerhalb von 30 Tagen
            unwiderruflich gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
          </p>

          <h2>13. Datensicherheit</h2>
          <p className="text-muted-foreground">
            Wir setzen technische und organisatorische Maßnahmen (TOM) ein, um Ihre Daten zu schützen:
          </p>
          <ul className="text-muted-foreground">
            <li>TLS-Verschlüsselung für alle Datenübertragungen</li>
            <li>Row-Level Security (RLS) auf Datenbankebene</li>
            <li>Passwort-Hashing (bcrypt via Supabase Auth)</li>
            <li>Rate Limiting und Abuse-Erkennung</li>
            <li>Regelmäßige Sicherheitsaudits</li>
          </ul>

          <h2>14. Minderjährige</h2>
          <p className="text-muted-foreground">
            Die Nutzung von HiOutz ist ab 16 Jahren gestattet (Art.&nbsp;8 DSGVO i.&nbsp;V.&nbsp;m. § 25 TDDDG).
            Personen unter 16 Jahren dürfen die App nur mit Einwilligung eines Erziehungsberechtigten nutzen.
          </p>

          <h2>15. Änderungen dieser Datenschutzerklärung</h2>
          <p className="text-muted-foreground">
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie stets den aktuellen rechtlichen
            Anforderungen anzupassen. Die jeweils aktuelle Fassung gilt bei Ihrem nächsten Besuch.
            Bei wesentlichen Änderungen informieren wir Sie per In-App-Benachrichtigung.
          </p>

          <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground italic">
              ⚠️ Hinweis: Diese Datenschutzerklärung wurde mit größter Sorgfalt erstellt, ersetzt aber keine
              individuelle Rechtsberatung. Bitte lasse sie vor Veröffentlichung von einem spezialisierten
              Datenschutz-Anwalt prüfen. Platzhalter in eckigen Klammern müssen durch die tatsächlichen
              Unternehmensdaten ersetzt werden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
