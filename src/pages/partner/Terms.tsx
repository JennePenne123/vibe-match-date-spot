import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { COMPANY, COMPANY_ADDRESS_INLINE } from '@/config/companyInfo';

/**
 * Partner-AGB – Allgemeine Geschäftsbedingungen für Venue-Partner
 * Rechtsform: H!Outz GmbH (i. Gr.)
 * Anwendbares Recht: Deutsches Recht / EU-Recht
 */
export default function PartnerTerms() {
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
              <FileText className="w-5 h-5 text-primary" />
              Partner-AGB
            </h1>
          </div>
        </div>

        <div className="px-4 py-6 prose prose-sm dark:prose-invert max-w-none">
          <p className="text-muted-foreground text-xs">
            Stand: März 2026 · {COMPANY.legalName}
          </p>

          <h2>§ 1 Geltungsbereich</h2>
          <p className="text-muted-foreground">
            (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend „Partner-AGB") regeln das Vertragsverhältnis
            zwischen der {COMPANY.legalName}, {COMPANY_ADDRESS_INLINE} (nachfolgend „Betreiber" oder „wir")
            und dem Venue-Partner (nachfolgend „Partner") hinsichtlich der Nutzung der Partner-Plattform
            der App „H!Outz" (nachfolgend „Plattform").
          </p>
          <p className="text-muted-foreground">
            (2) Die Plattform ermöglicht es Partnern, ihre Venues zu präsentieren, Voucher zu erstellen und
            von einem KI-gestützten Matching mit Endnutzern zu profitieren.
          </p>
          <p className="text-muted-foreground">
            (3) Abweichende Bedingungen des Partners werden nur anerkannt, sofern der Betreiber diesen
            ausdrücklich schriftlich zugestimmt hat.
          </p>

          <h2>§ 2 Vertragsgegenstand</h2>
          <p className="text-muted-foreground">
            (1) Der Betreiber stellt dem Partner eine webbasierte Plattform mit folgenden Leistungen zur Verfügung:
          </p>
          <ul className="text-muted-foreground">
            <li>Venue-Profilverwaltung (Beschreibungen, Fotos, Öffnungszeiten, Tags)</li>
            <li>Voucher-Erstellung und -Verwaltung mit QR-Code-Einlösung</li>
            <li>KI-gestütztes Matching der Venues mit Endnutzern</li>
            <li>Analytics-Dashboard mit Performance-Kennzahlen</li>
            <li>Partner-Netzwerk mit QR-Code-basierter Vernetzung</li>
            <li>Echtzeit-Feedback-Aggregation von Endnutzer-Bewertungen</li>
          </ul>
          <p className="text-muted-foreground">
            (2) Der Betreiber schuldet die Bereitstellung der Plattform in der jeweils aktuellen Version.
            Ein Anspruch auf bestimmte Funktionen oder ununterbrochene Verfügbarkeit besteht nicht.
            Wartungsbedingte Ausfallzeiten bleiben vorbehalten.
          </p>

          <h2>§ 3 Registrierung und Verifizierung</h2>
          <p className="text-muted-foreground">
            (1) Die Nutzung der Partner-Plattform setzt eine Registrierung und die Erstellung eines
            Partner-Profils voraus. Der Partner ist verpflichtet, wahrheitsgemäße und vollständige Angaben
            zu machen (Firmenname, Kontaktperson, Geschäfts-E-Mail, Anschrift).
          </p>
          <p className="text-muted-foreground">
            (2) Nach der Registrierung hat der Partner innerhalb von 7 Kalendertagen seine Identität und
            Geschäftslegitimation zu verifizieren. Die Verifizierung erfolgt über eine der folgenden Methoden:
          </p>
          <ul className="text-muted-foreground">
            <li>Umsatzsteuer-Identifikationsnummer (USt-IdNr.) – automatische Prüfung über das VIES-System der EU</li>
            <li>Steuernummer – manuelle Prüfung durch den Betreiber</li>
            <li>Handelsregisterauszug – Dokumentenprüfung</li>
          </ul>
          <p className="text-muted-foreground">
            (3) Bei nicht fristgerechter Verifizierung wird das Partner-Konto in einen eingeschränkten Modus
            versetzt (Soft-Lock). In diesem Modus sind keine neuen Voucher-Erstellungen oder Änderungen an
            Venue-Profilen möglich. Bestehende Voucher bleiben bis zu ihrem Ablauf gültig.
          </p>
          <p className="text-muted-foreground">
            (4) Der Betreiber behält sich vor, Partner-Konten bei begründetem Verdacht auf Missbrauch,
            falsche Angaben oder wiederholte Verstöße gegen diese AGB zu sperren oder zu löschen.
          </p>

          <h2>§ 4 Mitgliedschafts-Modelle und Gebühren</h2>
          <p className="text-muted-foreground">
            (1) Die Partner-Plattform bietet zwei Mitgliedschafts-Tiers:
          </p>
          <ul className="text-muted-foreground">
            <li>
              <strong>Free-Tier:</strong> Grundlegende Venue-Verwaltung, begrenzte Voucher-Erstellung,
              Standard-Analytics
            </li>
            <li>
              <strong>Pro-Tier (€14,90/Monat netto):</strong> Unbegrenzte Voucher, erweiterte Analytics,
              KI-Optimierungsvorschläge, Priority-Support, erweiterte Venue-Profileinstellungen (Best Times,
              Personality Wizard)
            </li>
          </ul>
          <p className="text-muted-foreground">
            (2) <strong>Founding Partner:</strong> Partner, die sich während der Startphase der Plattform
            registrieren und verifizieren, erhalten den Pro-Tier für 12 Monate kostenlos. Nach Ablauf gilt
            der reguläre Pro-Preis, sofern nicht vorher gekündigt wird.
          </p>
          <p className="text-muted-foreground">
            (3) <strong>Loyalitätsbonus:</strong> Partner, die mindestens 6 Monate aktiv und verifiziert auf der
            Plattform sind, können zusätzliche kostenlose Pro-Monate erhalten. Details werden individuell
            mitgeteilt.
          </p>
          <p className="text-muted-foreground">
            (4) Alle Preise verstehen sich zuzüglich der gesetzlichen Umsatzsteuer. Die Abrechnung erfolgt
            monatlich. Die aktuellen Preise sind jederzeit im Partner-Dashboard einsehbar.
          </p>
          <p className="text-muted-foreground">
            (5) Bei Zahlungsverzug von mehr als 14 Tagen wird das Konto auf den Free-Tier zurückgestuft.
            Pro-Funktionen werden bis zum Zahlungseingang gesperrt.
          </p>

          <h2>§ 5 Voucher-System</h2>
          <p className="text-muted-foreground">
            (1) Partner können über die Plattform digitale Voucher (Rabattgutscheine, Gratis-Artikel,
            Sonderangebote) für Endnutzer erstellen. Jeder Voucher erhält einen eindeutigen QR-Code
            zur Einlösung.
          </p>
          <p className="text-muted-foreground">
            (2) Die Standard-Gültigkeitsdauer eines Vouchers beträgt 30 Tage, sofern der Partner keine
            abweichende Laufzeit festlegt. Nicht eingelöste Voucher verfallen nach Ablauf der Gültigkeitsdauer
            ersatzlos.
          </p>
          <p className="text-muted-foreground">
            (3) Der Partner ist allein verantwortlich für die Erfüllung der im Voucher zugesagten Leistung.
            Der Betreiber agiert lediglich als technischer Vermittler und übernimmt keine Haftung für die
            Einlösung oder Qualität der Leistung.
          </p>
          <p className="text-muted-foreground">
            (4) Der Partner darf Voucher nicht zur Irreführung von Endnutzern verwenden. Insbesondere
            ist es untersagt, Voucher zu erstellen, deren Bedingungen nicht eingehalten werden können
            oder die gegen geltendes Recht (insbesondere UWG, PAngV) verstoßen.
          </p>
          <p className="text-muted-foreground">
            (5) Der Betreiber behält sich vor, Voucher bei Verdacht auf Missbrauch oder Rechtsverstoß
            zu deaktivieren.
          </p>

          <h2>§ 6 Pflichten des Partners</h2>
          <p className="text-muted-foreground">
            (1) Der Partner verpflichtet sich:
          </p>
          <ul className="text-muted-foreground">
            <li>Wahrheitsgemäße und aktuelle Angaben zu seinem Unternehmen und seinen Venues zu machen</li>
            <li>Änderungen unverzüglich in der Plattform zu aktualisieren (Öffnungszeiten, Anschrift, Kontaktdaten)</li>
            <li>Geltendes Recht einzuhalten, insbesondere Gewerberecht, Lebensmittelhygienerecht, Gaststättenrecht</li>
            <li>Nur Fotos und Inhalte hochzuladen, an denen er die erforderlichen Nutzungsrechte besitzt</li>
            <li>Die Zugangsdaten zum Partner-Konto vertraulich zu behandeln</li>
          </ul>
          <p className="text-muted-foreground">
            (2) Der Partner stellt den Betreiber von sämtlichen Ansprüchen Dritter frei, die aus der
            Verletzung dieser Pflichten resultieren.
          </p>

          <h2>§ 7 Pflichten des Betreibers</h2>
          <p className="text-muted-foreground">
            (1) Der Betreiber stellt die Plattform mit einer angestrebten Verfügbarkeit von 99 % im
            Jahresmittel bereit. Geplante Wartungsarbeiten werden nach Möglichkeit vorab angekündigt.
          </p>
          <p className="text-muted-foreground">
            (2) Der Betreiber gewährleistet angemessene technische und organisatorische Maßnahmen
            zum Schutz der Partner-Daten gemäß Art.&nbsp;32 DSGVO.
          </p>
          <p className="text-muted-foreground">
            (3) Support-Anfragen werden im Free-Tier innerhalb von 5 Werktagen, im Pro-Tier innerhalb
            von 2 Werktagen bearbeitet.
          </p>

          <h2>§ 8 Datenschutz</h2>
          <p className="text-muted-foreground">
            (1) Die Verarbeitung personenbezogener Daten des Partners richtet sich nach der separaten{' '}
            <a href="/partner/privacy" className="text-primary">Partner-Datenschutzerklärung</a>.
          </p>
          <p className="text-muted-foreground">
            (2) Soweit der Partner über die Plattform Zugang zu personenbezogenen Daten von Endnutzern
            erhält (z.&nbsp;B. aggregierte Feedback-Daten), verpflichtet er sich, diese ausschließlich für den
            vorgesehenen Zweck zu verwenden und nicht an Dritte weiterzugeben.
          </p>
          <p className="text-muted-foreground">
            (3) Soweit eine Auftragsverarbeitung im Sinne des Art.&nbsp;28 DSGVO vorliegt, wird ein gesonderter
            Auftragsverarbeitungsvertrag (AVV) geschlossen. Dieser ist auf Anfrage erhältlich.
          </p>

          <h2>§ 9 Geistiges Eigentum und Nutzungsrechte</h2>
          <p className="text-muted-foreground">
            (1) Der Partner räumt dem Betreiber ein einfaches, unentgeltliches, übertragbares Nutzungsrecht
            an den von ihm hochgeladenen Inhalten (Fotos, Beschreibungen, Logos) ein, soweit dies für den
            Betrieb der Plattform und die Darstellung des Venues gegenüber Endnutzern erforderlich ist.
          </p>
          <p className="text-muted-foreground">
            (2) Das Nutzungsrecht erlischt mit Beendigung des Vertragsverhältnisses, sofern keine
            gesetzlichen Aufbewahrungspflichten entgegenstehen.
          </p>
          <p className="text-muted-foreground">
            (3) Die Plattform, ihr Design, die Software und die KI-Algorithmen sind urheberrechtlich
            geschütztes Eigentum des Betreibers. Eine Nutzung über den vertraglichen Rahmen hinaus
            ist untersagt.
          </p>
          <p className="text-muted-foreground">
            (4) Der Partner darf das H!Outz-Logo und die Partnerbezeichnung ausschließlich im Rahmen
            der Partnerschaft und nach den Vorgaben des Betreibers verwenden.
          </p>

          <h2>§ 10 Haftung und Gewährleistung</h2>
          <p className="text-muted-foreground">
            (1) Der Betreiber haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie für Schäden
            aus der Verletzung des Lebens, des Körpers oder der Gesundheit.
          </p>
          <p className="text-muted-foreground">
            (2) Bei leichter Fahrlässigkeit haftet der Betreiber nur bei Verletzung wesentlicher
            Vertragspflichten (Kardinalpflichten). Die Haftung ist auf den vorhersehbaren,
            vertragstypischen Schaden begrenzt.
          </p>
          <p className="text-muted-foreground">
            (3) Der Betreiber haftet nicht für:
          </p>
          <ul className="text-muted-foreground">
            <li>Die Richtigkeit oder Vollständigkeit von KI-generierten Matching-Scores und Empfehlungen</li>
            <li>Umsatzsteigerungen oder Kundenfrequenzänderungen infolge der Plattformnutzung</li>
            <li>Handlungen oder Unterlassungen von Endnutzern</li>
            <li>Ausfälle oder Störungen, die auf höhere Gewalt oder Drittanbieter zurückzuführen sind</li>
          </ul>
          <p className="text-muted-foreground">
            (4) Die Haftung nach dem Produkthaftungsgesetz bleibt unberührt.
          </p>

          <h2>§ 11 Vertragslaufzeit und Kündigung</h2>
          <p className="text-muted-foreground">
            (1) Der Vertrag wird auf unbestimmte Zeit geschlossen und kann von beiden Seiten mit einer
            Frist von 30 Tagen zum Monatsende ordentlich gekündigt werden.
          </p>
          <p className="text-muted-foreground">
            (2) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
            Ein wichtiger Grund liegt insbesondere vor bei:
          </p>
          <ul className="text-muted-foreground">
            <li>Schweren oder wiederholten Verstößen gegen diese AGB</li>
            <li>Falschaussagen bei der Registrierung oder Verifizierung</li>
            <li>Zahlungsverzug von mehr als 30 Tagen (Pro-Tier)</li>
            <li>Insolvenzantrag des Partners</li>
          </ul>
          <p className="text-muted-foreground">
            (3) Nach Vertragsbeendigung werden:
          </p>
          <ul className="text-muted-foreground">
            <li>Venue-Profile innerhalb von 30 Tagen von der Plattform entfernt</li>
            <li>Aktive Voucher können bis zu ihrem Ablaufdatum von Endnutzern eingelöst werden</li>
            <li>Partner-Daten gemäß der Partner-Datenschutzerklärung gelöscht</li>
            <li>Abrechnungsdaten gemäß gesetzlicher Aufbewahrungspflichten (10 Jahre) archiviert</li>
          </ul>

          <h2>§ 12 Änderungen der AGB</h2>
          <p className="text-muted-foreground">
            (1) Der Betreiber behält sich vor, diese AGB mit einer Ankündigungsfrist von mindestens
            30 Tagen zu ändern. Änderungen werden per E-Mail und über eine Benachrichtigung im
            Partner-Dashboard mitgeteilt.
          </p>
          <p className="text-muted-foreground">
            (2) Widerspricht der Partner den geänderten AGB nicht innerhalb von 30 Tagen nach Zugang
            der Änderungsmitteilung, gelten die geänderten AGB als akzeptiert. Auf dieses Rechtsfolge
            wird in der Änderungsmitteilung ausdrücklich hingewiesen.
          </p>
          <p className="text-muted-foreground">
            (3) Im Falle eines Widerspruchs kann der Betreiber das Vertragsverhältnis mit einer Frist
            von 30 Tagen kündigen.
          </p>

          <h2>§ 13 Schlussbestimmungen</h2>
          <p className="text-muted-foreground">
            (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG).
          </p>
          <p className="text-muted-foreground">
            (2) Gerichtsstand für alle Streitigkeiten aus diesem Vertragsverhältnis ist – sofern der Partner
            Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen
            ist – der Sitz des Betreibers.
          </p>
          <p className="text-muted-foreground">
            (3) Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit
            der übrigen Bestimmungen davon unberührt. Anstelle der unwirksamen Bestimmung gilt eine wirksame
            Bestimmung als vereinbart, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am nächsten
            kommt (salvatorische Klausel).
          </p>
          <p className="text-muted-foreground">
            (4) Nebenabreden bedürfen der Schriftform. Dies gilt auch für die Aufhebung dieses
            Schriftformerfordernisses.
          </p>

          <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground italic">
              ⚠️ Hinweis: Diese Partner-AGB wurden mit größter Sorgfalt erstellt, ersetzen aber keine individuelle
              Rechtsberatung. Platzhalter in eckigen Klammern müssen durch die tatsächlichen Unternehmensdaten
              ersetzt werden. Bitte vor Veröffentlichung von einem Rechtsanwalt prüfen lassen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
