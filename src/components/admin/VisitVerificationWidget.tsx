import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { STALE_TIMES } from '@/config/queryConfig';
import { MapPinCheck, Info, Clock, Ruler } from 'lucide-react';
import {
  VISIT_ARRIVAL_RADIUS_M,
  VISIT_DEPARTURE_RADIUS_M,
  VISIT_MIN_STAY_MINUTES,
} from '@/services/visitVerificationService';

interface VisitMetrics {
  days_back: number;
  visits_total: number;
  visits_verified: number;
  visits_manual: number;
  visits_auto: number;
  visits_open: number;
  median_distance_m: number | null;
  p90_distance_m: number | null;
  distance_buckets: { bucket: string; count: number }[];
  median_stay_minutes: number | null;
  short_stays: number;
  feedback_total: number;
  feedback_verified: number;
}

const RANGES = [7, 30, 90];

/**
 * Shows how the geo check-in performs in the field, so the arrival /
 * departure radii can be tuned against real data instead of guesswork.
 */
const VisitVerificationWidget: React.FC = () => {
  const [days, setDays] = useState(30);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-visit-verification', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'get_visit_verification_metrics' as never,
        { days_back: days } as never,
      );
      if (error) throw error;
      return data as unknown as VisitMetrics;
    },
    staleTime: STALE_TIMES.ADMIN_ANALYTICS,
  });

  const verifiedPct = data && data.visits_total > 0
    ? Math.round((data.visits_verified / data.visits_total) * 100)
    : 0;
  const feedbackPct = data && data.feedback_total > 0
    ? Math.round((data.feedback_verified / data.feedback_total) * 100)
    : 0;
  const maxBucket = Math.max(1, ...((data?.distance_buckets || []).map((b) => b.count)));

  return (
    <Card className="bg-card/80 backdrop-blur border-border/40">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPinCheck className="w-5 h-5 text-primary" />
          Besuchs-Verifizierung
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Praxis-Check der Radien: aktuell {VISIT_ARRIVAL_RADIUS_M} m Ankunft,{' '}
          {VISIT_DEPARTURE_RADIUS_M} m Abreise, {VISIT_MIN_STAY_MINUTES} Min. Mindestaufenthalt.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={days === r ? 'default' : 'outline'}
              onClick={() => setDays(r)}
            >
              {r} Tage
            </Button>
          ))}
        </div>

        {isLoading && <Skeleton className="h-56 w-full" />}

        {!isLoading && (error || !data) && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Verifizierungs-Daten konnten nicht geladen werden.
          </p>
        )}

        {!isLoading && data && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Besuche" value={data.visits_total} />
              <Stat label="Bestätigt" value={data.visits_verified} />
              <Stat label="Automatisch" value={data.visits_auto} />
              <Stat label="Manuell" value={data.visits_manual} />
            </div>

            <div className="space-y-3">
              <Bar label="Bestätigte Besuche" pct={verifiedPct} />
              <Bar label="Bewertungen mit Standort-Nachweis" pct={feedbackPct} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Median-Distanz"
                icon={Ruler}
                value={data.median_distance_m ?? 0}
                suffix=" m"
              />
              <Stat
                label="Median-Aufenthalt"
                icon={Clock}
                value={data.median_stay_minutes ?? 0}
                suffix=" Min."
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Nächste gemessene Distanz</p>
              {(data.distance_buckets || []).length === 0 && (
                <p className="text-xs text-muted-foreground">Noch keine Messwerte.</p>
              )}
              {(data.distance_buckets || []).map((b) => (
                <div key={b.bucket} className="flex items-center gap-3 text-xs">
                  <span className="w-20 text-muted-foreground">{b.bucket}</span>
                  <div className="flex-1 h-2 rounded bg-muted/40 overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.round((b.count / maxBucket) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right tabular-nums text-foreground">{b.count}</span>
                </div>
              ))}
            </div>

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              Liegt die Median-Distanz deutlich unter {VISIT_ARRIVAL_RADIUS_M} m, können wir enger
              werden. Häufige Messwerte knapp über {VISIT_ARRIVAL_RADIUS_M} m oder viele Abbrüche
              unter {VISIT_MIN_STAY_MINUTES} Minuten ({data.short_stays} im Zeitraum) sprechen für
              einen etwas größeren Radius. {data.visits_open} Besuche laufen gerade noch.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const Bar: React.FC<{ label: string; pct: number }> = ({ label, pct }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground">{label}</span>
      <span className="tabular-nums font-medium text-muted-foreground">{pct}%</span>
    </div>
    <Progress value={pct} className="h-2" />
  </div>
);

const Stat: React.FC<{
  label: string;
  value: number;
  suffix?: string;
  icon?: React.ElementType;
}> = ({ label, value, suffix, icon: Icon }) => (
  <div className="rounded-lg border border-border/40 bg-background/40 p-3">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-primary flex-shrink-0" />}
      <p className="text-xl font-bold text-foreground tabular-nums">
        {value.toLocaleString('de-DE')}
        {suffix}
      </p>
    </div>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
  </div>
);

export default VisitVerificationWidget;
