import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STALE_TIMES } from '@/config/queryConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert, TrendingUp, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

type FunctionStat = {
  function_name: string;
  total: number;
  limited: number;
  abuseAvg: number;
  abuseMax: number;
  lastEvent: string;
  uniqueIdentifiers: number;
};

export const RateLimitMonitorWidget: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-ratelimit-monitor-24h'],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('request_logs')
        .select('function_name, was_rate_limited, abuse_score, timestamp, identifier_hash')
        .gte('timestamp', since)
        .order('timestamp', { ascending: false })
        .limit(1000);
      if (error) throw error;

      const byFn = new Map<string, FunctionStat>();
      const identifiersByFn = new Map<string, Set<string>>();

      (data || []).forEach(log => {
        const fn = log.function_name || 'unknown';
        if (!byFn.has(fn)) {
          byFn.set(fn, {
            function_name: fn,
            total: 0,
            limited: 0,
            abuseAvg: 0,
            abuseMax: 0,
            lastEvent: log.timestamp || '',
            uniqueIdentifiers: 0,
          });
          identifiersByFn.set(fn, new Set());
        }
        const stat = byFn.get(fn)!;
        stat.total++;
        if (log.was_rate_limited) stat.limited++;
        const score = Number(log.abuse_score) || 0;
        stat.abuseAvg += score;
        if (score > stat.abuseMax) stat.abuseMax = score;
        if (log.identifier_hash) identifiersByFn.get(fn)!.add(log.identifier_hash);
      });

      return Array.from(byFn.values())
        .map(stat => ({
          ...stat,
          abuseAvg: stat.total > 0 ? Math.round((stat.abuseAvg / stat.total) * 10) / 10 : 0,
          uniqueIdentifiers: identifiersByFn.get(stat.function_name)!.size,
        }))
        .sort((a, b) => b.limited - a.limited || b.total - a.total);
    },
    staleTime: STALE_TIMES.ADMIN,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const stats = data || [];
  const totalRequests = stats.reduce((s, x) => s + x.total, 0);
  const totalLimited = stats.reduce((s, x) => s + x.limited, 0);
  const limitRate = totalRequests > 0 ? Math.round((totalLimited / totalRequests) * 1000) / 10 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Activity className="h-3 w-3" /> Anfragen 24h
            </div>
            <div className="text-2xl font-bold mt-1">{totalRequests.toLocaleString('de-DE')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <ShieldAlert className="h-3 w-3" /> Limitiert
            </div>
            <div className="text-2xl font-bold mt-1">{totalLimited.toLocaleString('de-DE')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <TrendingUp className="h-3 w-3" /> Limit-Rate
            </div>
            <div className="text-2xl font-bold mt-1">{limitRate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edge Functions — Top 24h</CardTitle>
          <CardDescription>Sortiert nach Anzahl Rate-Limit-Auslösungen</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Daten in den letzten 24 h.</p>
          ) : (
            <div className="space-y-2">
              {stats.slice(0, 25).map(stat => {
                const pct = stat.total > 0 ? (stat.limited / stat.total) * 100 : 0;
                const severity = stat.abuseMax >= 80 ? 'destructive' : stat.abuseMax >= 50 ? 'default' : 'secondary';
                return (
                  <div key={stat.function_name} className="flex items-center justify-between gap-3 border-b border-border/40 pb-2 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm truncate">{stat.function_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {stat.total} Anfragen · {stat.uniqueIdentifiers} Identifikatoren · vor {formatDistanceToNow(new Date(stat.lastEvent), { locale: de })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {stat.limited > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {stat.limited} ({pct.toFixed(1)}%)
                        </Badge>
                      )}
                      {stat.abuseMax > 0 && (
                        <Badge variant={severity as any} className="text-xs">
                          Abuse {stat.abuseMax}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
