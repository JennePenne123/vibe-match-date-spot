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
          <h2>1. Datenschutz auf einen Blick</h2>
          <h3>Allgemeine Hinweise</h3>
          <p className="text-muted-foreground">
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Anwendung nutzen.
          </p>

          <h2>2. Verantwortlicher</h2>
          <p className="text-muted-foreground">
            [Firmenname]<br />
            [Adresse]<br />
            E-Mail: [E-Mail-Adresse]
          </p>

          <h2>3. Datenerfassung in dieser App</h2>
          <h3>Welche Daten werden erfasst?</h3>
          <p className="text-muted-foreground">
            Bei der Nutzung von VybePulse werden folgende Daten verarbeitet:
          </p>
          <ul className="text-muted-foreground">
            <li><strong>Account-Daten:</strong> E-Mail-Adresse, Name, Profilbild</li>
            <li><strong>Präferenzen:</strong> Bevorzugte Küchen, Vibes, Zeiten, Preisklassen, Ernährungseinschränkungen</li>
            <li><strong>Standortdaten:</strong> Heimadresse (optional), Geolocation für Venue-Suche</li>
            <li><strong>Nutzungsdaten:</strong> Date-Bewertungen, AI-Kompatibilitätswerte, Feedback</li>
            <li><strong>Gamification:</strong> Punkte, Level, Badges, Streaks</li>
          </ul>

          <h3>Wie werden die Daten erfasst?</h3>
          <p className="text-muted-foreground">
            Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen (z.B. bei der Registrierung oder beim Setzen von Präferenzen). Andere Daten werden automatisch beim Nutzen der App durch unsere IT-Systeme erfasst (z.B. technische Daten wie Browser, Betriebssystem).
          </p>

          <h2>4. Implizite Nutzungssignale</h2>
          <p className="text-muted-foreground">
            Um unsere KI-Empfehlungen zu verbessern, erfassen wir folgende implizite Verhaltensdaten:
          </p>
          <ul className="text-muted-foreground">
            <li><strong>Verweildauer:</strong> Wie lange Sie sich eine Venue-Detailseite ansehen</li>
            <li><strong>Scrolltiefe:</strong> Wie weit Sie auf einer Venue-Seite scrollen</li>
            <li><strong>Wiederholte Besuche:</strong> Ob Sie dieselbe Venue mehrfach aufrufen</li>
            <li><strong>Voucher-Interaktion:</strong> Ob Sie auf einen Voucher klicken (als Signal für Preissensitivität)</li>
            <li><strong>Nutzungszeiten:</strong> Zu welcher Tageszeit Sie die App verwenden</li>
          </ul>
          <p className="text-muted-foreground">
            Diese Signale werden pseudonymisiert Ihrem Benutzerkonto zugeordnet und ausschließlich zur Verbesserung der personalisierten Empfehlungen verwendet. Die Daten werden nicht an Dritte weitergegeben. Die Verarbeitung erfolgt auf Grundlage unseres berechtigten Interesses (Art. 6 Abs. 1 lit. f DSGVO).
          </p>
          <p className="text-muted-foreground">
            <strong>Widerspruchsrecht:</strong> Sie können die Erfassung impliziter Signale jederzeit in den App-Einstellungen unter „Datenschutz & Tracking" deaktivieren. Bereits erfasste Daten werden bei Deaktivierung nicht gelöscht, aber nicht mehr für zukünftige Empfehlungen herangezogen.
          </p>

          <h2>5. Externe Dienste</h2>
          <h3>Supabase</h3>
          <p className="text-muted-foreground">
            Wir nutzen Supabase für Authentifizierung, Datenbank und serverseitige Funktionen. Supabase verarbeitet Daten auf Servern in der EU.
          </p>

          <h3>OpenStreetMap / Overpass API</h3>
          <p className="text-muted-foreground">
            Für die Venue-Suche werden Standortdaten an die OpenStreetMap Overpass API übermittelt.
          </p>

          <h3>Foursquare / Radar</h3>
          <p className="text-muted-foreground">
            Zur Anreicherung von Venue-Informationen (Fotos, Bewertungen, Kategorien) werden Suchanfragen an die Foursquare Places API und/oder Radar API weitergeleitet. Dabei wird Ihre ungefähre Suchposition übermittelt. Die Verarbeitung erfolgt auf Grundlage unseres berechtigten Interesses an der Bereitstellung relevanter Venue-Informationen.
          </p>

          <h3>Sentry</h3>
          <p className="text-muted-foreground">
            Zur Fehlererkennung und Leistungsüberwachung nutzen wir Sentry (Functional Software Inc.). Bei Fehlern werden technische Daten (Fehlermeldung, Stack-Trace, Browser, Betriebssystem) sowie eine anonymisierte Session-Aufzeichnung an Sentry-Server übermittelt. Texteingaben werden dabei maskiert und Medieninhalte blockiert. Die Verarbeitung erfolgt auf Grundlage unseres berechtigten Interesses an der Stabilität der Anwendung (Art. 6 Abs. 1 lit. f DSGVO).
          </p>

          <h2>6. KI-gestützte Verarbeitung</h2>
          <p className="text-muted-foreground">
            VybePulse nutzt KI-Algorithmen zur Berechnung von Kompatibilitätswerten und Venue-Empfehlungen. Diese Verarbeitung erfolgt auf Basis Ihrer Präferenzen, Bewertungen und – sofern nicht deaktiviert – Ihrer impliziten Nutzungssignale. Die Berechnung erfolgt serverseitig in unserer eigenen Infrastruktur. Es werden keine personenbezogenen Daten an externe KI-Dienste übermittelt.
          </p>
          <p className="text-muted-foreground">
            Die KI passt ihre Empfehlungen kontinuierlich auf Basis Ihres Feedbacks an (adaptive Gewichtung). Sie können die Lernhistorie in Ihrem Profil einsehen.
          </p>

          <h2>7. Ihre Rechte</h2>
          <p className="text-muted-foreground">
            Sie haben jederzeit das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer Daten sowie das Recht auf Datenübertragbarkeit. Nutzen Sie dafür die Datenexport-Funktion in den App-Einstellungen oder kontaktieren Sie uns per E-Mail.
          </p>

          <h2>8. Datenlöschung</h2>
          <p className="text-muted-foreground">
            Sie können Ihr Konto und alle damit verbundenen Daten jederzeit über die Einstellungen löschen. Eine GDPR-konforme Datenexport-Funktion steht ebenfalls zur Verfügung.
          </p>

          <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground italic">
              Diese Datenschutzerklärung enthält Platzhalter. Bitte lasse sie von einem Rechtsanwalt prüfen und ergänzen, bevor du die App veröffentlichst.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
