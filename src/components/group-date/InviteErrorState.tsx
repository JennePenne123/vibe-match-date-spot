import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, Users, RefreshCw, ScanLine, Send, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GroupQRScanner from '@/components/group-date/GroupQRScanner';
import RequestInviteDialog from '@/components/group-date/RequestInviteDialog';

export type InviteErrorKind = 'missing' | 'invalid' | 'expired' | 'full' | 'closed' | 'failed';

const CONTENT: Record<InviteErrorKind, { title: string; description: string; hint: string }> = {
  missing: {
    title: 'Kein Einladungscode gefunden',
    description: 'Dieser Link enthält keinen gültigen Gruppen-Code.',
    hint: 'Bitte die Person, die dich eingeladen hat, um einen frischen Link oder QR-Code.',
  },
  invalid: {
    title: 'Einladung ungültig',
    description: 'Dieser Einladungscode gehört zu keiner aktiven Gruppe (mehr).',
    hint: 'Vielleicht wurde die Gruppe gelöscht oder der Code neu erstellt.',
  },
  expired: {
    title: 'Einladung abgelaufen',
    description: 'Dieser Einladungscode ist nicht mehr gültig.',
    hint: 'Einladungen laufen ab, damit niemand später ungefragt beitreten kann.',
  },
  full: {
    title: 'Gruppe ist voll',
    description: 'Diese Gruppe hat bereits die maximale Teilnehmerzahl erreicht.',
    hint: 'Frag nach, ob jemand Platz macht – oder startet eine neue Gruppe.',
  },
  closed: {
    title: 'Gruppe geschlossen',
    description: 'Diese Gruppe nimmt keine neuen Mitglieder mehr auf.',
    hint: 'Die Planung ist vermutlich schon abgeschlossen.',
  },
  failed: {
    title: 'Beitritt fehlgeschlagen',
    description: 'Da ist etwas schiefgelaufen. Bitte versuche es noch einmal.',
    hint: 'Prüfe deine Verbindung und versuche es erneut.',
  },
};

const ICONS: Record<InviteErrorKind, React.ElementType> = {
  missing: AlertCircle,
  invalid: AlertCircle,
  expired: Clock,
  full: Users,
  closed: Users,
  failed: AlertCircle,
};

interface InviteErrorStateProps {
  kind: InviteErrorKind;
  /** Extra detail from the server, shown below the description when present. */
  detail?: string;
  onRetry?: () => void;
}

const REQUEST_TEXT =
  'Hey! Dein H!Outz-Einladungslink funktioniert bei mir leider nicht mehr. ' +
  'Kannst du mir bitte einen neuen QR-Code oder Link schicken?';

const InviteErrorState: React.FC<InviteErrorStateProps> = ({ kind, detail, onRetry }) => {
  const navigate = useNavigate();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const { title, description, hint } = CONTENT[kind];
  const Icon = ICONS[kind];
  const canRetryCode = kind === 'missing' || kind === 'invalid' || kind === 'expired';

  const shareRequest = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: REQUEST_TEXT });
        return;
      } catch {
        /* user cancelled — fall back below */
      }
    }
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(REQUEST_TEXT)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <Icon className="h-6 w-6 text-destructive" />
      </div>
      <div className="space-y-1.5">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
        {detail && <p className="text-xs text-muted-foreground/80">{detail}</p>}
      </div>

      <p className="rounded-lg border border-border/50 bg-muted/40 p-3 text-xs text-muted-foreground">
        {hint}
      </p>

      <div className="space-y-2">
        {canRetryCode && (
          <Button className="w-full gap-2" onClick={() => setRequestOpen(true)}>
            <KeyRound className="h-4 w-4" />
            Neuen Code in der App anfordern
          </Button>
        )}
        {canRetryCode && (
          <Button variant="outline" className="w-full gap-2" onClick={shareRequest}>
            <Send className="h-4 w-4" />
            Per Nachricht anfragen
          </Button>
        )}
        {canRetryCode && (
          <Button variant="outline" className="w-full gap-2" onClick={() => setScannerOpen(true)}>
            <ScanLine className="h-4 w-4" />
            QR-Code erneut scannen
          </Button>
        )}
        {onRetry && (
          <Button variant="outline" className="w-full gap-2" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            Erneut versuchen
          </Button>
        )}
        <Button variant="ghost" className="w-full gap-2" onClick={() => navigate('/home')}>
          <Home className="h-4 w-4" />
          Zur Startseite
        </Button>
      </div>

      <GroupQRScanner open={scannerOpen} onOpenChange={setScannerOpen} />
      <RequestInviteDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  );
};

export default InviteErrorState;