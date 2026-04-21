import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/config/queryConfig';
import { Funnel, TrendingDown, AlertCircle } from 'lucide-react';
import {
  ONBOARDING_FUNNEL_STEPS,
  type FunnelAction,
} from '@/services/funnelAnalyticsService';

interface FunnelEvent {
  session_id: string;
  step_key: string;
  step_index: number;
  action: FunnelAction;
  created_at: string;
}

interface StepStat {
  key: string;
  index: number;
  label: string;
  entered: number;
  completed: number;
  skipped: number;
  errors: number;
  abandoned: number;
  /** % of users who entered this step relative to step 0 */
  reachedPct: number;
  /** % of those who entered who continued to next step */
  continuationPct: number;
}

/**
 * Onboarding Funnel Widget – visualises drop-off across the cold-start flow:
 * welcome → food/vibes → swipe → lifestyle → distance → preferences → friends → results.
 *
 * Aggregates `onboarding_funnel_events` from the last 7 days, grouped by
 * unique session_id so that re-tries within one session don't inflate counts.
 */
export const OnboardingFunnelWidget: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-onboarding-funnel-7d'],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('onboarding_funnel_events' as never)
        .select('session_id, step_key, step_index, action, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(5000);
      if (error) throw error;
      return (data || []) as unknown as FunnelEvent[];
    },
    staleTime: STALE_TIMES.ADMIN,
  });

  const { steps, totalSessions } = useMemo(() => {
    const events = data || [];

    // Per step → distinct sessions per action
    const perStep = new Map<
      string,
      { entered: Set<string>; completed: Set<string>; skipped: Set<string>; errors: Set<string>; abandoned: Set<string> }
    >();
    for (const def of ONBOARDING_FUNNEL_STEPS) {
      perStep.set(def.key, {
        entered: new Set(),
        completed: new Set(),
        skipped: new Set(),
        errors: new Set(),
        abandoned: new Set(),
      });
    }

    for (const ev of events) {
      const bucket = perStep.get(ev.step_key);
      if (!bucket) continue;
      switch (ev.action) {
        case 'entered': bucket.entered.add(ev.session_id); break;
        case 'completed': bucket.completed.add(ev.session_id); break;
        case 'skipped': bucket.skipped.add(ev.session_id); break;
        case 'error': bucket.errors.add(ev.session_id); break;
        case 'abandoned': bucket.abandoned.add(ev.session_id); break;
      }
    }

    const firstStepKey = ONBOARDING_FUNNEL_STEPS[0].key;
    const firstStepEntered = perStep.get(firstStepKey)?.entered.size ?? 0;

    const steps: StepStat[] = ONBOARDING_FUNNEL_STEPS.map((def, i) => {
      const b = perStep.get(def.key)!;
      const enteredCount = b.entered.size;
      const nextDef = ONBOARDING_FUNNEL_STEPS[i + 1];
      const nextEntered = nextDef ? perStep.get(nextDef.key)?.entered.size ?? 0 : null;
      return {
        key: def.key,
        index: def.index,
        label: def.label,
        entered: enteredCount,
        completed: b.completed.size,
        skipped: b.skipped.size,
        errors: b.errors.size,
        abandoned: b.abandoned.size,
        reachedPct: firstStepEntered > 0 ? (enteredCount / firstStepEntered) * 100 : 0,
        continuationPct:
          nextEntered !== null && enteredCount > 0
            ? (nextEntered / enteredCount) * 100
            : nextEntered === null
            ? 100
            : 0,
      };
    });

    return { steps, totalSessions: firstStepEntered };
  }, [data]);

  // Identify worst drop-off step (excluding the final one)
  const worstDropoff = useMemo(() => {
    if (steps.length < 2) return null;
    let worst: StepStat | null = null;
    let worstDrop = 0;
    for (let i = 0; i < steps.length - 1; i++) {
      const drop = 100 - steps[i].continuationPct;
      if (drop > worstDrop && steps[i].entered > 0) {
        worstDrop = drop;
        worst = steps[i];
      }
    }
    return worst ? { step: worst, dropPct: worstDrop } : null;
  }, [steps]);

  return (
    <Card className="bg-card/80 backdrop-blur border-border/40">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Funnel className="w-5 h-5 text-primary" />
          Onboarding Funnel
          <Badge variant="outline" className="ml-auto text-xs">Letzte 7 Tage</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Wo Nutzer:innen im Welcome → Preferences → Friends → Results Flow abspringen. Sessions
          werden anhand der browser-eigenen Session-ID dedupliziert.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : totalSessions === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Noch keine Funnel-Events in den letzten 7 Tagen. Sobald Nutzer:innen das Onboarding
            durchlaufen, erscheinen die Drop-off-Raten hier.
          </p>
        ) : (
          <>
            {/* Header summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-card/60 backdrop-blur border border-border/40 p-3 rounded-lg">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Sessions gestartet
                </p>
                <p className="text-2xl font-bold text-foreground">{totalSessions}</p>
              </div>
              <div className="bg-card/60 backdrop-blur border border-border/40 p-3 rounded-lg">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Bis zum Ergebnis
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {steps[steps.length - 1]?.entered ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {steps[steps.length - 1]?.reachedPct.toFixed(1)}% Conversion
                </p>
              </div>
              {worstDropoff && (
                <div className="bg-card/60 backdrop-blur border border-orange-500/30 p-3 rounded-lg">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-orange-400" />
                    Größter Drop-off
                  </p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {worstDropoff.step.label}
                  </p>
                  <p className="text-xs text-orange-400">
                    −{worstDropoff.dropPct.toFixed(1)}% zur nächsten Stufe
                  </p>
                </div>
              )}
            </div>

            {/* Funnel bars */}
            <div className="space-y-2">
              {steps.map((s, i) => {
                const dropToNext =
                  i < steps.length - 1 ? 100 - s.continuationPct : null;
                const isWorst = worstDropoff?.step.key === s.key;
                return (
                  <div key={s.key} className="group">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-foreground flex items-center gap-2">
                        <span className="text-muted-foreground tabular-nums">{i + 1}.</span>
                        {s.label}
                        {s.errors > 0 && (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0">
                            {s.errors} Fehler
                          </Badge>
                        )}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {s.entered} ({s.reachedPct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="relative h-6 bg-muted/40 rounded overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/70 transition-all"
                        style={{ width: `${s.reachedPct}%` }}
                      />
                    </div>
                    {dropToNext !== null && dropToNext > 0 && (
                      <div className="flex items-center gap-1 pl-3 mt-0.5 text-[10px]">
                        <TrendingDown
                          className={`w-3 h-3 ${
                            isWorst ? 'text-orange-400' : 'text-muted-foreground'
                          }`}
                        />
                        <span
                          className={
                            isWorst ? 'text-orange-400' : 'text-muted-foreground'
                          }
                        >
                          −{dropToNext.toFixed(1)}% zur nächsten Stufe
                          {s.skipped > 0 && ` · ${s.skipped} skipped`}
                          {s.abandoned > 0 && ` · ${s.abandoned} verlassen`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OnboardingFunnelWidget;