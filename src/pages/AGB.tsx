import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Scale } from 'lucide-react';
import { COMPANY, COMPANY_ADDRESS_INLINE } from '@/config/companyInfo';

export default function AGB() {
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
              <Scale className="w-5 h-5 text-primary" />
              Allgemeine Geschäftsbedingungen
            </h1>
          </div>
        </div>

        <div className="px-4 py-6 prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground text-xs">Stand: März 2026 · {COMPANY.legalName}</p>

          <h2>§ 1 Geltungsbereich</h2>
          <p className="text-muted-foreground">
            (1) Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der mobilen Anwendung „H!Outz"
            (nachfolgend „App"), betrieben von {COMPANY.legalName}, {COMPANY_ADDRESS_INLINE} (nachfolgend „Anbieter").
          </p>
          <p className="text-muted-foreground">
            (2) Abweichende Bedingungen des Nutzers werden nicht anerkannt, es sei denn, der Anbieter stimmt
            ihrer Geltung ausdrücklich schriftlich zu.
          </p>
          <p className="text-muted-foreground">
            (3) Die AGB gelten sowohl für Verbraucher als auch für Unternehmer im Sinne der §§ 13, 14 BGB.
          </p>

          <h2>§ 2 Leistungsbeschreibung</h2>
          <p className="text-muted-foreground">
            (1) H!Outz ist eine KI-gestützte Date-Planning-Plattform, die Nutzern personalisierte Venue-Empfehlungen
            und gemeinsame Planungsfunktionen bietet.
          </p>
          <p className="text-muted-foreground">
            (2) Der Anbieter schuldet die Bereitstellung der Plattform in der jeweils aktuellen Version.
            Ein Anspruch auf bestimmte Funktionen oder ständige Verfügbarkeit besteht nicht. Wartungsbedingte
            Ausfallzeiten bleiben vorbehalten.
          </p>
          <p className="text-muted-foreground">
            (3) KI-Empfehlungen sind technische Vorschläge und stellen keine Garantie für die Qualität eines
            Venues oder den Erfolg eines Dates dar.
          </p>

          <h2>§ 3 Registrierung und Nutzerkonto</h2>
          <p className="text-muted-foreground">
            (1) Für die Nutzung der App ist eine Registrierung erforderlich. Diese kann per E-Mail und Passwort
            oder über die Dienste Dritter (Google, Apple) erfolgen.
          </p>
          <p className="text-muted-foreground">
            (2) Bei der Registrierung über Google oder Apple gelten zusätzlich die Nutzungsbedingungen und
            Datenschutzrichtlinien des jeweiligen Anbieters.
          </p>
          <p className="text-muted-foreground">
            (3) Der Nutzer ist verpflichtet, wahrheitsgemäße Angaben zu machen und seine Zugangsdaten
            vertraulich zu behandeln. Jede Nutzung des Kontos wird dem Kontoinhaber zugerechnet.
          </p>
          <p className="text-muted-foreground">
            (4) Die Nutzung ist ab 16 Jahren gestattet. Minderjährige unter 16 Jahren benötigen die
            Einwilligung eines Erziehungsberechtigten.
          </p>
          <p className="text-muted-foreground">
            (5) Der Anbieter behält sich das Recht vor, Nutzerkonten bei Verstoß gegen diese AGB zu sperren
            oder zu löschen.
          </p>

          <h2>§ 4 Kostenlose und Premium-Nutzung</h2>
          <p className="text-muted-foreground">
            (1) H!Outz bietet eine kostenlose Basisversion sowie eine kostenpflichtige Premium-Mitgliedschaft
            mit erweiterten Funktionen.
          </p>
          <p className="text-muted-foreground">
            (2) Premium-Mitgliedschaften verlängern sich automatisch um den gewählten Zeitraum, sofern sie
            nicht mindestens 24 Stunden vor Ablauf der aktuellen Laufzeit gekündigt werden.
          </p>
          <p className="text-muted-foreground">
            (3) Verbraucher haben nach Abschluss eines Premium-Abonnements ein Widerrufsrecht von 14 Tagen
            gemäß § 355 BGB, sofern sie nicht ausdrücklich zugestimmt haben, dass die Leistung vor Ablauf der
            Widerrufsfrist beginnt.
          </p>
          <p className="text-muted-foreground">
            (4) Die aktuellen Preise und Leistungsumfänge sind in der App einsehbar.
          </p>

          <h2>§ 5 Punkte und Rewards</h2>
          <p className="text-muted-foreground">
            (1) Nutzer können durch Aktivitäten (Date-Bewertungen, Empfehlungen, Streaks) Punkte sammeln und
            diese im Reward Shop gegen Gutscheine oder Premium-Zugänge eintauschen.
          </p>
          <p className="text-muted-foreground">
            (2) Punkte stellen kein Zahlungsmittel dar und haben keinen monetären Gegenwert. Ein Anspruch auf
            bestimmte Rewards besteht nicht.
          </p>
          <p className="text-muted-foreground">
            (3) Der Anbieter behält sich vor, das Punktesystem und die verfügbaren Rewards jederzeit zu ändern.
            Bereits eingelöste Rewards bleiben davon unberührt.
          </p>
          <p className="text-muted-foreground">
            (4) Der Handel mit oder die Übertragung von Punkten ist nicht gestattet.
          </p>

          <h2>§ 6 Voucher</h2>
          <p className="text-muted-foreground">
            (1) Voucher werden von Partner-Venues bereitgestellt und unterliegen den jeweiligen Bedingungen
            des Partners. H!Outz agiert lediglich als Vermittler.
          </p>
          <p className="text-muted-foreground">
            (2) Der Anbieter übernimmt keine Haftung für die Einlösung, Qualität oder Verfügbarkeit der
            Leistungen der Partner-Venues.
          </p>
          <p className="text-muted-foreground">
            (3) Voucher haben eine Standardgültigkeit von 30 Tagen, sofern nicht anders angegeben.
            Nicht eingelöste Voucher verfallen nach Ablauf der Gültigkeitsdauer ersatzlos.
          </p>

          <h2>§ 7 Nutzerverhalten und Inhalte</h2>
          <p className="text-muted-foreground">
            (1) Der Nutzer verpflichtet sich, keine rechtswidrigen, beleidigenden, diskriminierenden oder
            anderweitig anstößigen Inhalte über die App zu verbreiten.
          </p>
          <p className="text-muted-foreground">
            (2) Der Nutzer räumt dem Anbieter ein einfaches, unentgeltliches Nutzungsrecht an von ihm
            eingestellten Inhalten (z.&nbsp;B. Profilbild, Bewertungen) ein, soweit dies für den Betrieb der
            Plattform erforderlich ist.
          </p>

          <h2>§ 8 Haftung</h2>
          <p className="text-muted-foreground">
            (1) Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie für Schäden aus
            der Verletzung des Lebens, des Körpers oder der Gesundheit.
          </p>
          <p className="text-muted-foreground">
            (2) Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten
            (Kardinalpflichten). Die Haftung ist in diesem Fall auf den vorhersehbaren, vertragstypischen Schaden
            begrenzt.
          </p>
          <p className="text-muted-foreground">
            (3) Die Haftung nach dem Produkthaftungsgesetz bleibt unberührt.
          </p>
          <p className="text-muted-foreground">
            (4) Der Anbieter haftet nicht für die Richtigkeit, Vollständigkeit oder Aktualität der
            KI-generierten Empfehlungen und Venue-Informationen.
          </p>

          <h2>§ 9 Widerrufsbelehrung für Verbraucher</h2>
          <p className="text-muted-foreground">
            <strong>Widerrufsrecht:</strong> Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen
            diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.
          </p>
          <p className="text-muted-foreground">
              Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ({COMPANY.legalName}, {COMPANY_ADDRESS_INLINE},
              E-Mail: {COMPANY.supportEmail}) mittels einer eindeutigen Erklärung (z.&nbsp;B. per E-Mail) über Ihren
              Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das{' '}
              <a href="/widerrufsformular" target="_blank" className="text-primary underline hover:text-primary/80">
                Muster-Widerrufsformular
              </a>{' '}
              verwenden, das jedoch nicht vorgeschrieben ist.
          </p>
          <p className="text-muted-foreground">
            Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des
            Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
          </p>
          <p className="text-muted-foreground">
            <strong>Folgen des Widerrufs:</strong> Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle
            Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen
            ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns
            eingegangen ist.
          </p>

          <h2>§ 10 Kündigung</h2>
          <p className="text-muted-foreground">
            (1) Der Nutzer kann sein Konto jederzeit über die Einstellungen oder per E-Mail an support@hioutz.app
            kündigen.
          </p>
          <p className="text-muted-foreground">
            (2) Mit der Kontolöschung erlöschen alle angesammelten Punkte und nicht eingelösten Voucher.
            Personenbezogene Daten werden gemäß unserer Datenschutzerklärung gelöscht.
          </p>
          <p className="text-muted-foreground">
            (3) Der Anbieter kann das Vertragsverhältnis mit einer Frist von 14 Tagen kündigen. Bei schweren
            Verstößen gegen diese AGB ist eine fristlose Kündigung möglich.
          </p>

          <h2>§ 11 Streitbeilegung</h2>
          <p className="text-muted-foreground">
            (1) Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary">
              ec.europa.eu/consumers/odr
            </a>.
          </p>
          <p className="text-muted-foreground">
            (2) Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>

          <h2>§ 12 Schlussbestimmungen</h2>
          <p className="text-muted-foreground">
            (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
            Bei Verbrauchern gilt diese Rechtswahl nur, soweit der Schutz zwingender Bestimmungen des
            Rechts des Staates, in dem der Verbraucher seinen gewöhnlichen Aufenthalt hat, nicht entzogen wird.
          </p>
          <p className="text-muted-foreground">
            (2) Gerichtsstand für alle Streitigkeiten mit Unternehmern ist der Sitz des Anbieters.
          </p>
          <p className="text-muted-foreground">
            (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit
            der übrigen Bestimmungen davon unberührt (salvatorische Klausel).
          </p>
          <p className="text-muted-foreground">
            (4) Der Anbieter behält sich vor, diese AGB mit angemessener Ankündigungsfrist zu ändern.
            Nutzer werden über Änderungen per In-App-Benachrichtigung informiert.
          </p>

          <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground italic">
              ⚠️ Hinweis: Diese AGB wurden mit größter Sorgfalt erstellt, ersetzten aber keine individuelle
              Rechtsberatung. Platzhalter in eckigen Klammern müssen durch die tatsächlichen Unternehmensdaten
              ersetzt werden. Bitte vor Veröffentlichung von einem Rechtsanwalt prüfen lassen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
