import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

/**
 * Partner-AGB Platzhalter-Seite.
 * Enthält die Struktur für die Allgemeinen Geschäftsbedingungen für Venue-Partner.
 * Die konkreten Texte müssen von einem Anwalt erstellt/geprüft werden.
 */
export default function PartnerTerms() {
  const navigate = useNavigate();

  const sections = [
    {
      title: '§ 1 Geltungsbereich',
      content: '[Hier den Geltungsbereich der AGB beschreiben – für wen gelten diese Bedingungen, welche Dienste werden abgedeckt.]',
    },
    {
      title: '§ 2 Vertragsgegenstand',
      content: '[Beschreibung der Plattform-Dienstleistungen: Venue-Management, Voucher-System, AI-Matching, Analytics-Dashboard, Partner-Netzwerk.]',
    },
    {
      title: '§ 3 Registrierung & Verifizierung',
      content: '[Anforderungen an die Partner-Registrierung, Verifizierungspflicht (7-Tage-Frist), Folgen bei Nicht-Verifizierung (Soft-Lock).]',
    },
    {
      title: '§ 4 Mitgliedschafts-Modelle & Gebühren',
      content: '[Free-Tier vs. Pro-Tier (€14,90/Monat), Leistungsumfang je Tier, Founding Partner Sonderkonditionen (1 Jahr kostenlos), Zahlungsbedingungen.]',
    },
    {
      title: '§ 5 Voucher-System',
      content: '[Regeln für die Erstellung und Einlösung von Vouchers, Gültigkeitsdauer (Standard 30 Tage), Haftung bei Missbrauch, Stornierungsbedingungen.]',
    },
    {
      title: '§ 6 Pflichten des Partners',
      content: '[Wahrheitsgemäße Angaben, Aktualisierungspflicht bei Änderungen, Einhaltung geltenden Rechts, Verantwortung für Venue-Inhalte und Fotos.]',
    },
    {
      title: '§ 7 Pflichten der Plattform',
      content: '[Verfügbarkeit der Plattform, Datensicherheit, Support-Leistungen, Haftungsbeschränkung.]',
    },
    {
      title: '§ 8 Datenschutz',
      content: '[Verweis auf die separate Partner-Datenschutzerklärung, Auftragsverarbeitung (AVV), Datenverarbeitung durch Drittanbieter (Supabase, Sentry, Stripe).]',
    },
    {
      title: '§ 9 Geistiges Eigentum',
      content: '[Nutzungsrechte an hochgeladenen Inhalten (Fotos, Beschreibungen), Lizenzrechte der Plattform, Markennutzung.]',
    },
    {
      title: '§ 10 Haftung & Gewährleistung',
      content: '[Haftungsbeschränkungen, Gewährleistungsausschlüsse, Haftung für AI-Empfehlungen.]',
    },
    {
      title: '§ 11 Vertragslaufzeit & Kündigung',
      content: '[Mindestlaufzeit, Kündigungsfristen (monatlich), Folgen der Kündigung (Datenlöschung, Voucher-Abwicklung), Außerordentliche Kündigung.]',
    },
    {
      title: '§ 12 Änderungen der AGB',
      content: '[Verfahren bei AGB-Änderungen, Benachrichtigungspflicht, Widerspruchsrecht, Zustimmungsfiktion.]',
    },
    {
      title: '§ 13 Schlussbestimmungen',
      content: '[Anwendbares Recht (deutsches Recht), Gerichtsstand, Salvatorische Klausel, Schriftformerfordernis.]',
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 gap-1">
        <ArrowLeft className="w-4 h-4" /> Zurück
      </Button>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Allgemeine Geschäftsbedingungen für Venue-Partner
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Version 1.0 · Stand: [Datum einfügen] · VybePulse GmbH
          </p>
        </CardHeader>
        <CardContent>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6">
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ Platzhalter-Dokument
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Diese AGB-Struktur muss von einem Rechtsanwalt geprüft und mit den konkreten Texten befüllt werden, bevor sie rechtlich wirksam ist.
            </p>
          </div>

          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 pr-4">
              {sections.map((section, idx) => (
                <div key={idx}>
                  <h3 className="font-semibold text-sm mb-2">{section.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
                  {idx < sections.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
