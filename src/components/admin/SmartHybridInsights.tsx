import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/config/queryConfig';
import { Sparkles, AlertTriangle, Zap, TrendingDown } from 'lucide-react';

interface HybridLog {
  response_time_ms: number | null;
  request_metadata: Record<string, any> | null;
  created_at: string | null;
}

const STAT_CARD =
  'bg-card/60 backdrop-blur border-border/40 p-3 rounded-lg flex flex-col gap-1';

/**
 * Smart Hybrid Insights – M1 monitoring widget.
 * Shows the strategy mix (Google primary vs. discovery vs. non-food),
 * Google timeout-rate and fallback frequency for the last 7 days.
 */
export const SmartHybridInsights: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-smart-hybrid-insights'],
    queryFn: async () => {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('api_usage_logs')
        .select('response_time_ms, request_metadata, created_at')
        .eq('api_name', 'smart_hybrid')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data || []) as HybridLog[];
    },
    staleTime: STALE_TIMES.ADMIN,
  });

  const stats = useMemo(() => {
    const logs = data || [];
    const total = logs.length;

    let googlePrimary = 0;
    let nonFood = 0;
    let discovery = 0;
    let timeouts = 0;
    let usedFallback = 0;
    let googleLatencySum = 0;
    let googleLatencyN = 0;

    logs.forEach((l) => {
      const m = l.request_metadata || {};
      const trigger = m.trigger as string | undefined;
      if (trigger === 'concrete_prefs') googlePrimary++;
      else if (trigger === 'non_food') nonFood++;
      else if (trigger === 'discovery') discovery++;
      if (m.google_timed_out) timeouts++;
      if (m.used_fallback) usedFallback++;
      if (trigger !== 'discovery' && typeof l.response_time_ms === 'number') {
        googleLatencySum += l.response_time_ms;
        googleLatencyN++;
      }
    });

    const googleRuns = googlePrimary + nonFood;
    const timeoutRate = googleRuns > 0 ? (timeouts / googleRuns) * 100 : 0;
    const fallbackRate = googleRuns > 0 ? (usedFallback / googleRuns) * 100 : 0;
    const avgGoogleLatency = googleLatencyN > 0 ? googleLatencySum / googleLatencyN : 0;

    return {
      total,
      googlePrimary,
      nonFood,
      discovery,
      timeoutRate,
      fallbackRate,
      avgGoogleLatency,
    };
  }, [data]);

  const timeoutBadgeVariant =
    stats.timeoutRate > 20 ? 'destructive' : stats.timeoutRate > 5 ? 'secondary' : 'outline';

  const latencyBadgeColor =
    stats.avgGoogleLatency > 6000
      ? 'text-red-400'
      : stats.avgGoogleLatency > 4000
      ? 'text-orange-400'
      : 'text-emerald-400';

  return (
    <Card className="bg-card/80 backdrop-blur border-border/40">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Smart Hybrid Insights
          <Badge variant="outline" className="ml-auto text-xs">
            Letzte 7 Tage
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Verteilung von Google-Primary vs. Discovery-Mode, Timeout-Rate und Fallback-Häufigkeit
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : stats.total === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Noch keine Smart-Hybrid-Calls in den letzten 7 Tagen geloggt. Daten erscheinen, sobald
            erste Recommendation-Anfragen laufen.
          </p>
        ) : (
          <>
            {/* Strategy mix */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className={STAT_CARD}>
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Google Primary
                </span>
                <span className="text-xl font-bold text-foreground">{stats.googlePrimary}</span>
                <span className="text-xs text-muted-foreground">
                  {((stats.googlePrimary / stats.total) * 100).toFixed(0)}% aller Calls
                </span>
              </div>
              <div className={STAT_CARD}>
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Non-Food (Google)
                </span>
                <span className="text-xl font-bold text-foreground">{stats.nonFood}</span>
                <span className="text-xs text-muted-foreground">
                  Kultur / Aktivität / Nightlife
                </span>
              </div>
              <div className={STAT_CARD}>
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Discovery (Free)
                </span>
                <span className="text-xl font-bold text-foreground">{stats.discovery}</span>
                <span className="text-xs text-muted-foreground">Radar + Overpass</span>
              </div>
              <div className={STAT_CARD}>
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Smart Hybrid Calls
                </span>
                <span className="text-xl font-bold text-foreground">{stats.total}</span>
                <span className="text-xs text-muted-foreground">geloggt 7d</span>
              </div>
            </div>

            {/* Health row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={STAT_CARD}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-muted-foreground">Google Timeout-Rate</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground">
                    {stats.timeoutRate.toFixed(1)}%
                  </span>
                  <Badge variant={timeoutBadgeVariant} className="text-[10px]">
                    {stats.timeoutRate > 20
                      ? 'kritisch'
                      : stats.timeoutRate > 5
                      ? 'beobachten'
                      : 'gesund'}
                  </Badge>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Anteil &gt; {7000}ms Hard-Cap
                </span>
              </div>

              <div className={STAT_CARD}>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-muted-foreground">Fallback-Häufigkeit</span>
                </div>
                <span className="text-2xl font-bold text-foreground">
                  {stats.fallbackRate.toFixed(1)}%
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Google leer → Radar/Overpass aktiv
                </span>
              </div>

              <div className={STAT_CARD}>
                <div className="flex items-center gap-2">
                  <Zap className={`w-4 h-4 ${latencyBadgeColor}`} />
                  <span className="text-xs text-muted-foreground">Ø Google Latenz</span>
                </div>
                <span className={`text-2xl font-bold ${latencyBadgeColor}`}>
                  {(stats.avgGoogleLatency / 1000).toFixed(2)}s
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Ziel &lt; 4s · Hard-Cap 7s
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartHybridInsights;