import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import CollaborativeWaitingState from '@/components/date-planning/CollaborativeWaitingState';

interface WaitingForPartnerProps {
  partnerName: string;
  sessionId: string;
  userCompleted: boolean;
  partnerCompleted: boolean;
  currentUserName: string;
}

export const WaitingForPartner: React.FC<WaitingForPartnerProps> = ({
  partnerName, sessionId, userCompleted, partnerCompleted, currentUserName,
}) => (
  <div className="mt-6 space-y-4">
    <div className="border-t border-border" />
    <CollaborativeWaitingState
      partnerName={partnerName} sessionId={sessionId}
      hasPartnerSetPreferences={partnerCompleted} isWaitingForPartner
      hasCurrentUserSetPreferences={userCompleted} currentUserName={currentUserName}
    />
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
          <h3 className="text-base font-semibold">Deine Präferenzen gespeichert!</h3>
        </div>
        <p className="text-sm text-muted-foreground">Warte auf {partnerName}...</p>
      </CardContent>
    </Card>
  </div>
);

interface AIAnalysisOverlayProps {
  timeoutTriggered: boolean;
}

export const AIAnalysisOverlay: React.FC<AIAnalysisOverlayProps> = ({ timeoutTriggered }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
    <Card className="w-full max-w-md mx-4 border-primary/20 shadow-lg">
      <CardContent className="p-6 text-center">
        <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto mb-3" />
        <h3 className="text-lg font-semibold mb-1">{timeoutTriggered ? 'Dauert etwas länger...' : 'KI-Analyse läuft'}</h3>
        <p className="text-sm text-muted-foreground">{timeoutTriggered ? 'Zeige dir die besten Ergebnisse.' : 'Kompatibilität wird analysiert...'}</p>
      </CardContent>
    </Card>
  </div>
);

interface RedirectingOverlayProps {
  autoNavigating: boolean;
  venueCount: number;
  onDisplayVenues: () => void;
}

export const RedirectingOverlay: React.FC<RedirectingOverlayProps> = ({ autoNavigating, venueCount, onDisplayVenues }) => {
  const hasVenues = venueCount > 0;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className={cn('w-full max-w-md mx-4 shadow-lg', hasVenues ? 'border-primary/20' : 'border-muted-foreground/20')}>
        <CardContent className="p-6 text-center">
          {autoNavigating ? <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-3" />
            : hasVenues ? <CheckCircle className="h-6 w-6 text-primary mx-auto mb-3" />
            : <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-3" />}
          <h3 className="text-lg font-semibold mb-1">
            {autoNavigating ? 'Weiterleitung...' : hasVenues ? 'Analyse fertig!' : 'Fast bereit...'}
          </h3>
          {hasVenues ? (
            <>
              <p className="text-foreground mb-1">{venueCount} Venues gefunden!</p>
              {!autoNavigating && (
                <Button onClick={onDisplayVenues} className="mt-3">Matches ansehen</Button>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">Suche läuft...</p>
              <Button onClick={onDisplayVenues} variant="outline" size="sm">
                <AlertCircle className="h-4 w-4 mr-1" /> Trotzdem weiter
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface SoloAIStatusProps {}

export const SoloAIStatus: React.FC<SoloAIStatusProps> = () => (
  <Card className="border-primary/20 mt-6">
    <CardContent className="p-6 text-center">
      <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto mb-3" />
      <h3 className="text-lg font-semibold mb-1">KI-Analyse läuft</h3>
      <p className="text-sm text-muted-foreground">Analysiere Präferenzen und suche Venues...</p>
    </CardContent>
  </Card>
);
