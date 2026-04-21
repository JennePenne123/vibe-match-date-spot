import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STALE_TIMES } from '@/config/queryConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  DollarSign, Activity, Database, TrendingUp, AlertTriangle,
  RefreshCw, MapPin, Globe, Sparkles, Calendar
} from 'lucide-react';
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid, AreaChart, Area
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import { SmartHybridInsights } from '@/components/admin/SmartHybridInsights';

// API metadata: free tier limits, color, icon, friendly name, pricing
const API_META: Record<string, {
  label: string;
  color: string;
  icon: any;
  costPer1k: number;        // USD per 1000 calls
  freeMonthly?: number;     // free monthly call quota
  category: 'venues' | 'geo' | 'ai' | 'cache' | 'other';
}> = {
  google_places: { label: 'Google Places', color: '#4285F4', icon: MapPin, costPer1k: 17, freeMonthly: 11750, category: 'venues' },
  google_places_details: { label: 'Google Places Details', color: '#34A853', icon: MapPin, costPer1k: 17, freeMonthly: 11750, category: 'venues' },
  foursquare: { label: 'Foursquare', color: '#F94877', icon: MapPin, costPer1k: 0, freeMonthly: 28500, category: 'venues' },
  foursquare_details: { label: 'Foursquare Details', color: '#FA4778', icon: MapPin, costPer1k: 0, freeMonthly: 28500, category: 'venues' },
  overpass: { label: 'OSM / Overpass', color: '#7EBC6F', icon: Globe, costPer1k: 0, category: 'venues' },
  radar: { label: 'Radar (Geo)', color: '#7B61FF', icon: Globe, costPer1k: 1, freeMonthly: 100000, category: 'geo' },
  openai_gpt4: { label: 'OpenAI GPT-4', color: '#10A37F', icon: Sparkles, costPer1k: 30, category: 'ai' },
  openai_gpt35: { label: 'OpenAI GPT-3.5', color: '#0EA37F', icon: Sparkles, costPer1k: 2, category: 'ai' },
  analyze_compatibility: { label: 'AI Compatibility', color: '#10A37F', icon: Sparkles, costPer1k: 10, category: 'ai' },
  venue_cache: { label: 'Venue Cache', color: '#9CA3AF', icon: Database, costPer1k: 0, category: 'cache' },
  supabase_edge: { label: 'Supabase Edge', color: '#3ECF8E', icon: Database, costPer1k: 0.002, category: 'other' },
};

const getMeta = (apiName: string) => API_META[apiName] || {
  label: apiName, color: '#6B7280', icon: Activity, costPer1k: 0, category: 'other' as const,
};

type TimeRange = '7d' | '30d' | '90d';

const CostMonitoring: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const startDate = startOfDay(subDays(new Date(), daysBack));

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-cost-monitoring', timeRange],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from('api_usage_logs')
        .select('api_name, estimated_cost, cache_hit, response_time_ms, response_status, created_at, endpoint')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(10000);
      if (error) throw error;
      return logs || [];
    },
    staleTime: STALE_TIMES.ADMIN,
  });

  // Recent calls (top 50)
  const { data: recentCalls } = useQuery({
    queryKey: ['admin-cost-recent'],
    queryFn: async () => {
      const { data } = await supabase
        .from('api_usage_logs')
        .select('id, api_name, endpoint, response_status, response_time_ms, estimated_cost, cache_hit, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    staleTime: STALE_TIMES.ADMIN,
  });

  const stats = useMemo(() => {
    const logs = data || [];
    const totalCalls = logs.length;
    const totalCost = logs.reduce((s, l) => s + (Number(l.estimated_cost) || 0), 0);
    const cacheHits = logs.filter(l => l.cache_hit).length;
    const cacheRate = totalCalls > 0 ? (cacheHits / totalCalls) * 100 : 0;
    const errors = logs.filter(l => (l.response_status || 0) >= 400).length;
    const avgResponse = logs.length
      ? logs.reduce((s, l) => s + (Number(l.response_time_ms) || 0), 0) / logs.length
      : 0;

    // By API breakdown
    const byApiMap: Record<string, { calls: number; cost: number; cacheHits: number }> = {};
    logs.forEach(l => {
      const k = l.api_name || 'unknown';
      if (!byApiMap[k]) byApiMap[k] = { calls: 0, cost: 0, cacheHits: 0 };
      byApiMap[k].calls++;
      byApiMap[k].cost += Number(l.estimated_cost) || 0;
      if (l.cache_hit) byApiMap[k].cacheHits++;
    });
    const byApi = Object.entries(byApiMap).map(([name, v]) => ({
      name, ...v, meta: getMeta(name),
    })).sort((a, b) => b.cost - a.cost || b.calls - a.calls);

    // Daily series
    const days = eachDayOfInterval({ start: startDate, end: new Date() });
    const dailyMap = new Map<string, { date: string; calls: number; cost: number }>();
    days.forEach(d => dailyMap.set(format(d, 'yyyy-MM-dd'), {
      date: format(d, 'dd.MM.', { locale: de }), calls: 0, cost: 0,
    }));
    logs.forEach(l => {
      const k = format(new Date(l.created_at!), 'yyyy-MM-dd');
      const e = dailyMap.get(k);
      if (e) {
        e.calls++;
        e.cost += Number(l.estimated_cost) || 0;
      }
    });
    const daily = Array.from(dailyMap.values());

    // Forecast: average daily cost × 30
    const avgDailyCost = totalCost / Math.max(daysBack, 1);
    const avgDailyCalls = totalCalls / Math.max(daysBack, 1);
    const projectedMonthlyCost = avgDailyCost * 30;
    const projectedMonthlyCalls = avgDailyCalls * 30;

    // Free-tier coverage per API
    const freeTierStatus = byApi.map(api => {
      const projectedMonthly = (api.calls / Math.max(daysBack, 1)) * 30;
      const free = api.meta.freeMonthly || 0;
      const utilization = free > 0 ? (projectedMonthly / free) * 100 : 0;
      const overage = Math.max(projectedMonthly - free, 0);
      const projectedSpend = (overage / 1000) * api.meta.costPer1k;
      return { ...api, projectedMonthly, free, utilization, projectedSpend };
    });

    return {
      totalCalls, totalCost, cacheRate, errors, avgResponse, byApi, daily,
      avgDailyCost, projectedMonthlyCost, projectedMonthlyCalls, freeTierStatus,
    };
  }, [data, daysBack, startDate]);

  const formatUsd = (n: number) => `$${n.toFixed(n < 1 ? 4 : 2)}`;
  const formatEur = (n: number) => `€${(n * 0.92).toFixed(n < 1 ? 4 : 2)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            API Cost Monitoring
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tracke API-Calls von Google Places, Foursquare, OSM, Radar und prognostiziere Monatskosten
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <TabsList>
              <TabsTrigger value="7d">7 Tage</TabsTrigger>
              <TabsTrigger value="30d">30 Tage</TabsTrigger>
              <TabsTrigger value="90d">90 Tage</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Top KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={Activity} color="text-cyan-400"
          label="API Calls" value={stats.totalCalls.toLocaleString()}
          sub={`${stats.errors} Fehler`} loading={isLoading}
        />
        <KpiCard
          icon={DollarSign} color="text-red-400"
          label="Kosten (Periode)"
          value={formatUsd(stats.totalCost)}
          sub={formatEur(stats.totalCost)} loading={isLoading}
        />
        <KpiCard
          icon={TrendingUp} color="text-orange-400"
          label="Prognose / Monat"
          value={formatUsd(stats.projectedMonthlyCost)}
          sub={`~${Math.round(stats.projectedMonthlyCalls).toLocaleString()} Calls`}
          loading={isLoading}
        />
        <KpiCard
          icon={Database} color="text-emerald-400"
          label="Cache Hit Rate"
          value={`${stats.cacheRate.toFixed(0)}%`}
          sub={`Ø ${Math.round(stats.avgResponse)}ms`} loading={isLoading}
        />
      </div>

      {/* Free Tier Status */}
      <Card className="bg-card/80 backdrop-blur border-border/40">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Free-Tier Auslastung & Monatsprognose
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Geschätzte monatliche Calls vs. kostenlose Quota – Mehrkosten werden automatisch berechnet
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : stats.freeTierStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Keine API-Calls in dieser Periode. Daten erscheinen, sobald API-Anfragen geloggt werden.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.freeTierStatus.map(api => (
                <FreeTierRow key={api.name} api={api} formatUsd={formatUsd} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts: Daily trend + cost share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card/80 backdrop-blur border-border/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Tägliche Calls & Kosten
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[260px] w-full" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={stats.daily}>
                  <defs>
                    <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="calls" stroke="hsl(var(--primary))" fill="url(#callsGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur border-border/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Kosten-Verteilung nach API
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[260px] w-full" /> : stats.byApi.filter(a => a.cost > 0).length === 0 ? (
              <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground">
                <Database className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">Keine kostenpflichtigen API-Calls</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={stats.byApi.filter(a => a.cost > 0)}
                    dataKey="cost"
                    nameKey="name"
                    cx="50%" cy="50%" outerRadius={90}
                    label={({ name, percent }) => `${getMeta(name).label}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats.byApi.filter(a => a.cost > 0).map(e => (
                      <Cell key={e.name} fill={e.meta.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatUsd(v)}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* By API table */}
      <Card className="bg-card/80 backdrop-blur border-border/40">
        <CardHeader>
          <CardTitle className="text-base">Calls nach API</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-32 w-full" /> : stats.byApi.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Keine Daten</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left text-muted-foreground">
                    <th className="py-2 px-2 font-medium">API</th>
                    <th className="py-2 px-2 font-medium text-right">Calls</th>
                    <th className="py-2 px-2 font-medium text-right">Cache</th>
                    <th className="py-2 px-2 font-medium text-right">Kosten</th>
                    <th className="py-2 px-2 font-medium text-right">$/1k</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byApi.map(api => {
                    const Icon = api.meta.icon;
                    const cacheRate = api.calls > 0 ? (api.cacheHits / api.calls) * 100 : 0;
                    return (
                      <tr key={api.name} className="border-b border-border/20 hover:bg-muted/20">
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" style={{ color: api.meta.color }} />
                            <span className="text-foreground">{api.meta.label}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right text-foreground">{api.calls.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{cacheRate.toFixed(0)}%</td>
                        <td className="py-2 px-2 text-right font-medium text-foreground">{formatUsd(api.cost)}</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">${api.meta.costPer1k.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent calls */}
      <Card className="bg-card/80 backdrop-blur border-border/40">
        <CardHeader>
          <CardTitle className="text-base">Letzte 50 API-Calls</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentCalls || recentCalls.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Keine Calls vorhanden</p>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b border-border/40 text-left text-muted-foreground">
                    <th className="py-2 px-2 font-medium">API</th>
                    <th className="py-2 px-2 font-medium">Status</th>
                    <th className="py-2 px-2 font-medium text-right">Zeit</th>
                    <th className="py-2 px-2 font-medium text-right">Kosten</th>
                    <th className="py-2 px-2 font-medium text-center">Cache</th>
                    <th className="py-2 px-2 font-medium text-right">Wann</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCalls.map(call => {
                    const meta = getMeta(call.api_name);
                    const Icon = meta.icon;
                    return (
                      <tr key={call.id} className="border-b border-border/20 hover:bg-muted/20">
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                            <span className="truncate max-w-[140px] text-foreground">{meta.label}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          {call.response_status ? (
                            <Badge variant={call.response_status >= 400 ? 'destructive' : 'outline'} className="text-xs">
                              {call.response_status}
                            </Badge>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="py-2 px-2 text-right text-muted-foreground text-xs">
                          {call.response_time_ms ? `${Math.round(call.response_time_ms)}ms` : '—'}
                        </td>
                        <td className="py-2 px-2 text-right text-foreground">
                          {call.estimated_cost ? formatUsd(Number(call.estimated_cost)) : '—'}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {call.cache_hit ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">HIT</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">MISS</Badge>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right text-muted-foreground text-xs">
                          {call.created_at && format(new Date(call.created_at), 'dd.MM. HH:mm')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const KpiCard: React.FC<{
  icon: any; color: string; label: string; value: string | number; sub?: string; loading?: boolean;
}> = ({ icon: Icon, color, label, value, sub, loading }) => (
  <Card className="bg-card/80 backdrop-blur border-border/40">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      <Icon className={`w-5 h-5 ${color}`} />
    </CardHeader>
    <CardContent>
      {loading ? <Skeleton className="h-8 w-20" /> : (
        <>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </>
      )}
    </CardContent>
  </Card>
);

const FreeTierRow: React.FC<{
  api: { name: string; calls: number; meta: any; projectedMonthly: number; free: number; utilization: number; projectedSpend: number };
  formatUsd: (n: number) => string;
}> = ({ api, formatUsd }) => {
  const Icon = api.meta.icon;
  const hasFreeTier = api.free > 0;
  const overFree = api.utilization > 100;
  const warning = api.utilization > 80;

  return (
    <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: api.meta.color }} />
          <span className="font-medium text-foreground text-sm">{api.meta.label}</span>
          {overFree && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />Über Free Tier
            </Badge>
          )}
          {!overFree && warning && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
              {api.utilization.toFixed(0)}% Free Tier
            </Badge>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">{formatUsd(api.projectedSpend)}/Monat</p>
          <p className="text-xs text-muted-foreground">
            {Math.round(api.projectedMonthly).toLocaleString()} Calls projiziert
          </p>
        </div>
      </div>
      {hasFreeTier && (
        <div className="space-y-1">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${overFree ? 'bg-destructive' : warning ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(api.utilization, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {Math.round(api.projectedMonthly).toLocaleString()} / {api.free.toLocaleString()} Free-Tier Calls
          </p>
        </div>
      )}
      {!hasFreeTier && api.meta.costPer1k === 0 && (
        <p className="text-xs text-emerald-400">✓ Komplett kostenlos</p>
      )}
    </div>
  );
};

export default CostMonitoring;