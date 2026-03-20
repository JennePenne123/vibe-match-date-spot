import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';
import { ShieldAlert, Clock, Activity, AlertTriangle, Zap, DollarSign, Server, RefreshCw } from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';

type TimeRange = '24h' | '7d' | '30d';

const SystemHealth: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const daysBack = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
  const startDate = startOfDay(subDays(new Date(), daysBack));

  const tooltipStyle = {
    contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' },
    labelStyle: { color: 'hsl(var(--foreground))' },
  };

  // Rate limit data
  const { data: rateLimitData, isLoading: rlLoading } = useQuery({
    queryKey: ['admin-rate-limits', timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('request_logs')
        .select('id, function_name, was_rate_limited, abuse_score, timestamp, request_count')
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false })
        .limit(500);
      return data || [];
    },
    staleTime: 60_000,
  });

  // Error logs
  const { data: errorLogs, isLoading: errLoading } = useQuery({
    queryKey: ['admin-error-logs', timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('error_logs')
        .select('id, error_type, severity, error_message, component_name, route, created_at, resolved')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(200);
      return data || [];
    },
    staleTime: 60_000,
  });

  // API cost trend
  const { data: apiCostTrend, isLoading: costLoading } = useQuery({
    queryKey: ['admin-api-cost-trend', timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('api_usage_logs')
        .select('api_name, estimated_cost, created_at, cache_hit')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })
        .limit(1000);

      const days = eachDayOfInterval({ start: startDate, end: new Date() });
      const byDay = new Map<string, { cost: number; calls: number; cacheHits: number }>();
      days.forEach(d => byDay.set(format(d, 'yyyy-MM-dd'), { cost: 0, calls: 0, cacheHits: 0 }));

      (data || []).forEach(log => {
        const day = format(new Date(log.created_at!), 'yyyy-MM-dd');
        const entry = byDay.get(day);
        if (entry) {
          entry.cost += Number(log.estimated_cost) || 0;
          entry.calls++;
          if (log.cache_hit) entry.cacheHits++;
        }
      });

      return Array.from(byDay.entries()).map(([date, stats]) => ({
        date,
        label: format(new Date(date), 'dd. MMM', { locale: de }),
        cost: Math.round(stats.cost * 1000) / 1000,
        calls: stats.calls,
        cacheRate: stats.calls > 0 ? Math.round((stats.cacheHits / stats.calls) * 100) : 0,
      }));
    },
    staleTime: 120_000,
  });

  // Sessions
  const { data: sessions, isLoading: sessLoading } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('date_planning_sessions')
        .select('id, session_status, created_at, updated_at, planning_mode')
        .in('session_status', ['active', 'expired'])
        .order('updated_at', { ascending: false })
        .limit(20);
      return data || [];
    },
    staleTime: 60_000,
  });

  // Computed stats
  const blockedRequests = (rateLimitData || []).filter(r => r.was_rate_limited);
  const highAbuse = (rateLimitData || []).filter(r => (r.abuse_score || 0) > 5);
  const unresolvedErrors = (errorLogs || []).filter(e => !e.resolved);
  const criticalErrors = (errorLogs || []).filter(e => e.severity === 'critical');
  const totalApiCost = apiCostTrend?.reduce((s, d) => s + d.cost, 0) || 0;

  // Error by type for pie
  const errorByType = (() => {
    const map = new Map<string, number>();
    (errorLogs || []).forEach(e => {
      map.set(e.error_type, (map.get(e.error_type) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  })();

  // Rate limit by function
  const rlByFunction = (() => {
    const map = new Map<string, { total: number; blocked: number }>();
    (rateLimitData || []).forEach(r => {
      const entry = map.get(r.function_name) || { total: 0, blocked: 0 };
      entry.total++;
      if (r.was_rate_limited) entry.blocked++;
      map.set(r.function_name, entry);
    });
    return Array.from(map.entries()).map(([name, stats]) => ({
      name: name.replace(/-/g, ' '),
      total: stats.total,
      blocked: stats.blocked,
    })).sort((a, b) => b.total - a.total);
  })();

  const COLORS = ['hsl(var(--primary))', 'hsl(330 80% 60%)', 'hsl(45 90% 55%)', 'hsl(0 70% 60%)', 'hsl(160 60% 50%)'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Health</h1>
          <p className="text-muted-foreground text-sm mt-1">Monitoring, Errors, API-Kosten & Rate-Limits</p>
        </div>
        <div className="flex gap-2">
          {(['24h', '7d', '30d'] as TimeRange[]).map(range => (
            <Button key={range} variant={timeRange === range ? 'default' : 'outline'} size="sm"
              onClick={() => setTimeRange(range)}>
              {range === '24h' ? '24h' : range === '7d' ? '7 Tage' : '30 Tage'}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <HealthKpi icon={ShieldAlert} label="Rate-Limited" value={blockedRequests.length}
          color={blockedRequests.length > 0 ? 'text-red-400' : 'text-emerald-400'} loading={rlLoading} />
        <HealthKpi icon={Activity} label="High Abuse" value={highAbuse.length}
          color={highAbuse.length > 0 ? 'text-amber-400' : 'text-emerald-400'} loading={rlLoading} />
        <HealthKpi icon={AlertTriangle} label="Ungelöste Errors" value={unresolvedErrors.length}
          color={unresolvedErrors.length > 5 ? 'text-red-400' : 'text-emerald-400'} loading={errLoading} />
        <HealthKpi icon={Zap} label="Kritische Errors" value={criticalErrors.length}
          color={criticalErrors.length > 0 ? 'text-red-400' : 'text-emerald-400'} loading={errLoading} />
        <HealthKpi icon={DollarSign} label="API-Kosten" value={`€${totalApiCost.toFixed(2)}`}
          color="text-blue-400" loading={costLoading} />
      </div>

      <Tabs defaultValue="errors" className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="ratelimits">Rate-Limits</TabsTrigger>
          <TabsTrigger value="costs">API-Kosten</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        {/* Errors */}
        <TabsContent value="errors" className="mt-4 space-y-6">
          {errorByType.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/80 border-border/40">
                <CardHeader><CardTitle className="text-lg">Fehler nach Typ</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={errorByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={2}
                        label={({ name, value }) => `${name}: ${value}`}>
                        {errorByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip {...tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border/40">
                <CardHeader><CardTitle className="text-lg">Übersicht</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gesamt Fehler</span><span className="font-semibold">{errorLogs?.length || 0}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Ungelöst</span><span className="font-semibold text-amber-400">{unresolvedErrors.length}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Kritisch</span><span className="font-semibold text-red-400">{criticalErrors.length}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Gelöst</span><span className="font-semibold text-emerald-400">{(errorLogs?.length || 0) - unresolvedErrors.length}</span></div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="bg-card/80 border-border/40">
            <CardHeader><CardTitle className="text-lg">Neueste Fehler</CardTitle></CardHeader>
            <CardContent>
              {errLoading ? <Skeleton className="h-40 w-full" /> : unresolvedErrors.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {unresolvedErrors.slice(0, 30).map(err => (
                      <div key={err.id} className="p-3 rounded-lg bg-muted/30 border border-border/20">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{err.error_message.slice(0, 120)}</p>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              <Badge variant={err.severity === 'critical' ? 'destructive' : 'secondary'} className="text-xs">{err.severity}</Badge>
                              <Badge variant="outline" className="text-xs">{err.error_type}</Badge>
                              {err.component_name && <span className="text-xs text-muted-foreground">{err.component_name}</span>}
                              {err.route && <span className="text-xs text-muted-foreground">{err.route}</span>}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(err.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Keine ungelösten Fehler ✓</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rate Limits */}
        <TabsContent value="ratelimits" className="mt-4 space-y-6">
          <Card className="bg-card/80 border-border/40">
            <CardHeader><CardTitle className="text-lg">Requests nach Funktion</CardTitle></CardHeader>
            <CardContent>
              {rlLoading ? <Skeleton className="h-64 w-full" /> : rlByFunction.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rlByFunction} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="total" name="Gesamt" fill="hsl(var(--primary) / 0.5)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="blocked" name="Blockiert" fill="hsl(0 70% 60%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Keine Request-Logs im Zeitraum</p>
              )}
            </CardContent>
          </Card>

          {blockedRequests.length > 0 && (
            <Card className="bg-card/80 border-border/40">
              <CardHeader><CardTitle className="text-lg">Blockierte Requests</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2">
                    {blockedRequests.map(req => (
                      <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                        <div>
                          <p className="text-sm font-medium text-foreground">{req.function_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {req.timestamp && new Date(req.timestamp).toLocaleString('de-DE')}
                          </p>
                        </div>
                        <Badge variant="destructive" className="text-xs">Abuse: {req.abuse_score}</Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* API Costs */}
        <TabsContent value="costs" className="mt-4">
          <Card className="bg-card/80 border-border/40">
            <CardHeader><CardTitle className="text-lg">API-Kosten & Cache-Rate über Zeit</CardTitle></CardHeader>
            <CardContent>
              {costLoading ? <Skeleton className="h-72 w-full" /> : apiCostTrend && apiCostTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={apiCostTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} unit="%" />
                    <Tooltip {...tooltipStyle} />
                    <Line yAxisId="left" type="monotone" dataKey="cost" name="Kosten (€)" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="cacheRate" name="Cache-Rate (%)" stroke="hsl(160 60% 50%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">Keine Kostendaten vorhanden</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sessions */}
        <TabsContent value="sessions" className="mt-4">
          <Card className="bg-card/80 border-border/40">
            <CardHeader><CardTitle className="text-lg">Planning Sessions</CardTitle></CardHeader>
            <CardContent>
              {sessLoading ? <Skeleton className="h-40 w-full" /> : (sessions || []).length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {(sessions || []).map(s => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="text-xs font-mono text-foreground">{s.id.slice(0, 8)}…</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">{s.planning_mode}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(s.updated_at).toLocaleString('de-DE')}
                            </span>
                          </div>
                        </div>
                        <Badge variant={s.session_status === 'active' ? 'default' : 'secondary'} className="text-xs">
                          {s.session_status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Keine Sessions</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const HealthKpi: React.FC<{
  icon: React.ElementType; label: string; value: number | string; color: string; loading: boolean;
}> = ({ icon: Icon, label, value, color, loading }) => (
  <Card className="bg-card/80 backdrop-blur border-border/40">
    <CardContent className="pt-5 pb-4">
      <div className="flex items-center gap-3">
        <Icon className={`w-6 h-6 ${color} flex-shrink-0`} />
        <div className="min-w-0">
          {loading ? <Skeleton className="h-7 w-16" /> : (
            <p className="text-xl font-bold text-foreground tabular-nums">{value}</p>
          )}
          <p className="text-xs text-muted-foreground truncate">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default SystemHealth;
