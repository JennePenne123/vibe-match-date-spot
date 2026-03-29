import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

/**
 * Partner-Datenschutzerklärung Platzhalter-Seite.
 * Struktur für die Datenschutzerklärung speziell für Venue-Partner.
 * Die konkreten Texte müssen von einem Datenschutzbeauftragten/Anwalt erstellt werden.
 */
export default function PartnerPrivacy() {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Verantwortlicher',
      content: '[Dzeng GmbH, Adresse, Kontaktdaten des Datenschutzbeauftragten einfügen.]',
    },
    {
      title: '2. Erhobene Daten',
      content: '[Beschreibung aller erhobenen Partner-Daten: Firmendaten, Kontaktdaten, Steuernummer, Venue-Informationen, Nutzungsdaten des Dashboards, Voucher-Transaktionen.]',
    },
    {
      title: '3. Zweck der Datenverarbeitung',
      content: '[Vertragsdurchführung, Verifizierung, Abrechnung, Analytics-Bereitstellung, AI-Matching-Integration, Support, Fraud-Prevention.]',
    },
    {
      title: '4. Rechtsgrundlagen (Art. 6 DSGVO)',
      content: '[Vertragserfüllung (Art. 6 Abs. 1 lit. b), berechtigte Interessen (Art. 6 Abs. 1 lit. f), gesetzliche Pflichten (Art. 6 Abs. 1 lit. c), Einwilligung (Art. 6 Abs. 1 lit. a).]',
    },
    {
      title: '5. Datenempfänger & Auftragsverarbeiter',
      content: '[Supabase (Datenbank & Auth), Sentry (Error Monitoring), Stripe (Zahlungsabwicklung – geplant), Radar/Foursquare (Venue-Daten), Hosting-Provider.]',
    },
    {
      title: '6. Datenübermittlung in Drittländer',
      content: '[Informationen zu Datenübermittlungen außerhalb der EU, Standardvertragsklauseln, Angemessenheitsbeschlüsse.]',
    },
    {
      title: '7. Speicherdauer',
      content: '[Dauer der Datenspeicherung je Kategorie: Vertragsdaten (Vertragslaufzeit + gesetzliche Aufbewahrungspflicht), Transaktionsdaten (10 Jahre), Nutzungsdaten (90 Tage), Error Logs (30 Tage).]',
    },
    {
      title: '8. Betroffenenrechte',
      content: '[Auskunftsrecht (Art. 15), Berichtigungsrecht (Art. 16), Löschungsrecht (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20), Widerspruchsrecht (Art. 21), Beschwerderecht bei Aufsichtsbehörde.]',
    },
    {
      title: '9. Automatisierte Entscheidungsfindung & AI',
      content: '[Erklärung der AI-Nutzung: Venue-Matching basiert auf Nutzer-Präferenzen und aggregiertem Feedback. Keine automatisierten Entscheidungen mit rechtlicher Wirkung für Partner. Transparenz über Ranking-Faktoren.]',
    },
    {
      title: '10. Cookies & Tracking',
      content: '[Verwendete Cookies, Session-Management, Analytics, Opt-Out-Möglichkeiten.]',
    },
    {
      title: '11. Datensicherheit',
      content: '[Technische und organisatorische Maßnahmen: Verschlüsselung, RLS-Policies, Rate Limiting, Input Sanitization, regelmäßige Security Audits.]',
    },
    {
      title: '12. Auftragsverarbeitungsvertrag (AVV)',
      content: '[Hinweis auf separaten AVV gemäß Art. 28 DSGVO, Verfügbarkeit auf Anfrage.]',
    },
    {
      title: '13. Änderungen der Datenschutzerklärung',
      content: '[Verfahren bei Änderungen, Benachrichtigungspflicht, Versionierung.]',
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
            <Shield className="w-5 h-5 text-primary" />
            Datenschutzerklärung für Venue-Partner
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Version 1.0 · Stand: [Datum einfügen] · Dzeng GmbH
          </p>
        </CardHeader>
        <CardContent>
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6">
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              ⚠️ Platzhalter-Dokument
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Diese Datenschutzerklärung muss von einem Datenschutzbeauftragten oder Rechtsanwalt geprüft und vervollständigt werden.
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
