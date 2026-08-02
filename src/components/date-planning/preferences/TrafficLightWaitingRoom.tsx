import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Clock, Users, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

export interface WaitingParticipant {
  id: string;
  name: string;
  ready: boolean;
  isSelf?: boolean;
}

export type TrafficLightPhase = 'red' | 'orange' | 'green';

export const getTrafficLightPhase = (readyCount: number, total: number): TrafficLightPhase => {
  if (total <= 0) return 'red';
  if (readyCount >= total) return 'green';
  if (total - readyCount === 1 || readyCount / total >= 0.5) return 'orange';
  return 'red';
};

const LIGHTS: { key: TrafficLightPhase; active: string; glow: string }[] = [
  { key: 'red', active: 'bg-red-500', glow: 'shadow-[0_0_18px_hsl(0_84%_60%/0.7)]' },
  { key: 'orange', active: 'bg-orange-500', glow: 'shadow-[0_0_18px_hsl(25_95%_53%/0.7)]' },
  { key: 'green', active: 'bg-emerald-500', glow: 'shadow-[0_0_18px_hsl(160_84%_39%/0.7)]' },
];

interface TrafficLightWaitingRoomProps {
  participants: WaitingParticipant[];
}

const TrafficLightWaitingRoom: React.FC<TrafficLightWaitingRoomProps> = ({ participants }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const total = participants.length;
  const readyCount = participants.filter(p => p.ready).length;
  const phase = getTrafficLightPhase(readyCount, total);
  const nextUp = participants.find(p => !p.ready);

  const statusText =
    phase === 'green'
      ? t('datePlanning.waitingRoom.green', 'Alle bereit – Venue-Suche startet!')
      : phase === 'orange'
        ? t('datePlanning.waitingRoom.orange', 'Fast fertig – noch einen Moment')
        : t('datePlanning.waitingRoom.red', 'Warten auf die anderen');

  return (
    <Card className="border-primary/20 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-5">
          {/* Ampel */}
          <div className="flex flex-col gap-2 rounded-2xl bg-muted/60 p-2.5 border border-border/60">
            {LIGHTS.map(light => {
              const isOn = light.key === phase;
              return (
                <span
                  key={light.key}
                  className={cn(
                    'h-6 w-6 rounded-full transition-all duration-500',
                    isOn ? `${light.active} ${light.glow}` : 'bg-muted-foreground/20',
                    isOn && phase !== 'green' && 'animate-pulse',
                  )}
                />
              );
            })}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{readyCount}/{total} {t('datePlanning.waitingRoom.ready', 'bereit')}</span>
            </div>
            <h3 className="text-base font-semibold leading-tight">{statusText}</h3>
            {phase !== 'green' && nextUp && (
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {t('datePlanning.waitingRoom.nextUp', 'Als Nächstes')}: {nextUp.name}
              </p>
            )}
          </div>
        </div>

        {/* Teilnehmerliste */}
        <ul className="mt-4 space-y-2">
          {participants.map(p => (
            <li
              key={p.id}
              className={cn(
                'flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors',
                p.ready ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-muted/30',
              )}
            >
              <span className="truncate text-sm font-medium">
                {p.name}{p.isSelf ? ` (${t('datePlanning.waitingRoom.you', 'Du')})` : ''}
              </span>
              {p.ready ? (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" />
                  {t('datePlanning.waitingRoom.done', 'fertig')}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 animate-pulse" />
                  {t('datePlanning.waitingRoom.pending', 'trägt ein …')}
                </span>
              )}
            </li>
          ))}
        </ul>

        {/* Wartezeit überbrücken: Venues schon mal stöbern */}
        {phase !== 'green' && (
          <div className="mt-4 rounded-lg border border-border/60 bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-2">
              {t('datePlanning.waitingRoom.browseHint', 'Wartezeit überbrücken: Stöbere schon mal durch Venues – eure gemeinsamen Empfehlungen erscheinen automatisch, sobald alle fertig sind.')}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => navigate('/venues', { state: { returnTo: location.pathname + location.search } })}
            >
              <Compass className="h-4 w-4 mr-1.5" />
              {t('datePlanning.waitingRoom.browseVenues', 'Venues ansehen')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrafficLightWaitingRoom;
