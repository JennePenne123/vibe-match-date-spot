import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Scale } from 'lucide-react';

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
          <h2>§ 1 Geltungsbereich</h2>
          <p className="text-muted-foreground">
            Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Plattform Dzeng, betrieben von [Firmenname].
          </p>

          <h2>§ 2 Leistungsbeschreibung</h2>
          <p className="text-muted-foreground">
            Dzeng ist eine KI-gestützte Date-Planning-Plattform, die Nutzern personalisierte Venue-Empfehlungen und Planungsfunktionen bietet.
          </p>

          <h2>§ 3 Registrierung und Nutzerkonto</h2>
          <p className="text-muted-foreground">
            Für die Nutzung der Plattform ist eine Registrierung erforderlich. Der Nutzer ist verpflichtet, wahrheitsgemäße Angaben zu machen und seine Zugangsdaten vertraulich zu behandeln.
          </p>

          <h2>§ 4 Kostenlose und Premium-Nutzung</h2>
          <p className="text-muted-foreground">
            Dzeng bietet eine kostenlose Basisversion sowie eine kostenpflichtige Premium-Mitgliedschaft mit erweiterten Funktionen. Details zu den Leistungsunterschieden finden sich in der aktuellen Preisübersicht.
          </p>

          <h2>§ 5 Punkte und Rewards</h2>
          <p className="text-muted-foreground">
            Nutzer können durch Aktivitäten Punkte sammeln und diese im Reward Shop gegen Gutscheine oder Premium-Zugänge eintauschen. Ein Anspruch auf bestimmte Rewards besteht nicht. [Firmenname] behält sich vor, das Punktesystem jederzeit anzupassen.
          </p>

          <h2>§ 6 Voucher</h2>
          <p className="text-muted-foreground">
            Voucher werden von Partner-Venues bereitgestellt und unterliegen den jeweiligen Bedingungen des Partners. Dzeng übernimmt keine Haftung für die Einlösung bei Partner-Venues.
          </p>

          <h2>§ 7 Haftung</h2>
          <p className="text-muted-foreground">
            [Standardmäßiger Haftungsausschluss – bitte von einem Rechtsanwalt formulieren lassen.]
          </p>

          <h2>§ 8 Kündigung</h2>
          <p className="text-muted-foreground">
            Der Nutzer kann sein Konto jederzeit über die Einstellungen löschen. Mit der Löschung erlöschen alle angesammelten Punkte und nicht eingelösten Voucher.
          </p>

          <h2>§ 9 Schlussbestimmungen</h2>
          <p className="text-muted-foreground">
            Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist [Ort], sofern der Nutzer Kaufmann ist.
          </p>

          <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground italic">
              Diese AGB enthalten Platzhalter und müssen vor Veröffentlichung von einem Rechtsanwalt geprüft und vervollständigt werden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
