import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/config/queryConfig';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, CartesianGrid, Legend
} from 'recharts';
import { Users, TrendingUp, Calendar, Activity, RefreshCw } from 'lucide-react';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import OnboardingFunnelWidget from '@/components/admin/OnboardingFunnelWidget';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(330 80% 60%)',
  'hsl(160 60% 50%)',
  'hsl(45 90% 55%)',
  'hsl(0 70% 60%)',
  'hsl(210 70% 60%)',
];

type TimeRange = '7d' | '30d' | '90d';

const AdminAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const startDate = startOfDay(subDays(new Date(), daysBack));

  // User registration trend
  const { data: registrationTrend, isLoading: regLoading } = useQuery({
    queryKey: ['admin-registration-trend', timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      const days = eachDayOfInterval({ start: startDate, end: new Date() });
      const countByDay = new Map<string, number>();
      days.forEach(d => countByDay.set(format(d, 'yyyy-MM-dd'), 0));

      (data || []).forEach(p => {
        const day = format(new Date(p.created_at), 'yyyy-MM-dd');
        countByDay.set(day, (countByDay.get(day) || 0) + 1);
      });

      let cumulative = 0;
      return Array.from(countByDay.entries()).map(([date, count]) => {
        cumulative += count;
        return {
          date,
          label: format(new Date(date), 'dd. MMM', { locale: de }),
          registrations: count,
          total: cumulative,
        };
      });
    },
    staleTime: STALE_TIMES.ADMIN_ANALYTICS,
  });

  // Date activity trend
  const { data: dateActivityTrend, isLoading: dateLoading } = useQuery({
    queryKey: ['admin-date-activity-trend', timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('date_invitations')
        .select('created_at, status, date_status')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      const days = eachDayOfInterval({ start: startDate, end: new Date() });
      const byDay = new Map<string, { created: number; accepted: number; completed: number }>();
      days.forEach(d => byDay.set(format(d, 'yyyy-MM-dd'), { created: 0, accepted: 0, completed: 0 }));

      (data || []).forEach(inv => {
        const day = format(new Date(inv.created_at), 'yyyy-MM-dd');
        const entry = byDay.get(day);
        if (entry) {
          entry.created++;
          if (inv.status === 'accepted') entry.accepted++;
          if (inv.date_status === 'completed') entry.completed++;
        }
      });

      return Array.from(byDay.entries()).map(([date, counts]) => ({
        date,
        label: format(new Date(date), 'dd. MMM', { locale: de }),
        ...counts,
      }));
    },
    staleTime: STALE_TIMES.ADMIN_ANALYTICS,
  });

  // API usage by service
  const { data: apiUsage, isLoading: apiLoading } = useQuery({
    queryKey: ['admin-api-usage', timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('api_usage_logs')
        .select('api_name, estimated_cost, cache_hit, response_time_ms, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000);

      const byApi = new Map<string, { calls: number; cost: number; cacheHits: number; avgTime: number; times: number[] }>();
      (data || []).forEach(log => {
        const existing = byApi.get(log.api_name) || { calls: 0, cost: 0, cacheHits: 0, avgTime: 0, times: [] };
        existing.calls++;
        existing.cost += Number(log.estimated_cost) || 0;
        if (log.cache_hit) existing.cacheHits++;
        if (log.response_time_ms) existing.times.push(log.response_time_ms);
        byApi.set(log.api_name, existing);
      });

      return Array.from(byApi.entries()).map(([name, stats]) => ({
        name: name.replace(/_/g, ' '),
        calls: stats.calls,
        cost: Math.round(stats.cost * 1000) / 1000,
        cacheHits: stats.cacheHits,
        cacheRate: stats.calls > 0 ? Math.round((stats.cacheHits / stats.calls) * 100) : 0,
        avgTime: stats.times.length > 0 ? Math.round(stats.times.reduce((a, b) => a + b, 0) / stats.times.length) : 0,
      }));
    },
    staleTime: STALE_TIMES.ADMIN_ANALYTICS,
  });

  // Dates by status (pie)
  const { data: datesByStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['admin-dates-by-status', timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from('date_invitations')
        .select('date_status, status')
        .gte('created_at', startDate.toISOString());

      const statusCount = new Map<string, number>();
      (data || []).forEach(d => {
        const status = d.date_status || d.status || 'unbekannt';
        statusCount.set(status, (statusCount.get(status) || 0) + 1);
      });

      return Array.from(statusCount.entries()).map(([name, value]) => ({ name, value }));
    },
    staleTime: STALE_TIMES.ADMIN_ANALYTICS,
  });

  // Engagement summary stats
  const totalRegistrations = registrationTrend?.reduce((s, d) => s + d.registrations, 0) || 0;
  const totalDatesCreated = dateActivityTrend?.reduce((s, d) => s + d.created, 0) || 0;
  const totalCompleted = dateActivityTrend?.reduce((s, d) => s + d.completed, 0) || 0;
  const totalApiCalls = apiUsage?.reduce((s, a) => s + a.calls, 0) || 0;

  const tooltipStyle = {
    contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' },
    labelStyle: { color: 'hsl(var(--foreground))' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Detaillierte Plattform-Statistiken und Trends</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as TimeRange[]).map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? '7 Tage' : range === '30d' ? '30 Tage' : '90 Tage'}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Users} label="Neue Nutzer" value={totalRegistrations} color="text-blue-500" loading={regLoading} />
        <SummaryCard icon={Calendar} label="Dates erstellt" value={totalDatesCreated} color="text-pink-500" loading={dateLoading} />
        <SummaryCard icon={TrendingUp} label="Abgeschlossen" value={totalCompleted} color="text-emerald-500" loading={dateLoading} />
        <SummaryCard icon={Activity} label="API Calls" value={totalApiCalls} color="text-amber-500" loading={apiLoading} />
      </div>

      <Tabs defaultValue="growth" className="w-full">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="growth">Nutzerwachstum</TabsTrigger>
          <TabsTrigger value="dates">Date-Aktivität</TabsTrigger>
          <TabsTrigger value="api">API-Nutzung</TabsTrigger>
        </TabsList>

        {/* User growth */}
        <TabsContent value="growth" className="mt-4">
          <Card className="bg-card/80 backdrop-blur border-border/40">
            <CardHeader>
              <CardTitle className="text-lg">Registrierungen & kumulatives Wachstum</CardTitle>
            </CardHeader>
            <CardContent>
              {regLoading ? <Skeleton className="h-72 w-full" /> : (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={registrationTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis yAxisId="left" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Tooltip {...tooltipStyle} />
                    <Legend />
                    <Area yAxisId="right" type="monotone" dataKey="total" name="Gesamt" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Bar yAxisId="left" dataKey="registrations" name="Neue Nutzer" fill="hsl(var(--primary) / 0.6)" radius={[3, 3, 0, 0]} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Date activity */}
        <TabsContent value="dates" className="mt-4 space-y-6">
          <Card className="bg-card/80 backdrop-blur border-border/40">
            <CardHeader>
              <CardTitle className="text-lg">Date-Aktivität über Zeit</CardTitle>
            </CardHeader>
            <CardContent>
              {dateLoading ? <Skeleton className="h-72 w-full" /> : (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={dateActivityTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Tooltip {...tooltipStyle} />
                    <Legend />
                    <Line type="monotone" dataKey="created" name="Erstellt" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="accepted" name="Akzeptiert" stroke="hsl(160 60% 50%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="completed" name="Abgeschlossen" stroke="hsl(330 80% 60%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pie chart */}
          <Card className="bg-card/80 backdrop-blur border-border/40">
            <CardHeader>
              <CardTitle className="text-lg">Verteilung nach Status</CardTitle>
            </CardHeader>
            <CardContent>
              {statusLoading ? <Skeleton className="h-64 w-full" /> : datesByStatus && datesByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={datesByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}
                      label={({ name, value }) => `${name}: ${value}`}>
                      {datesByStatus.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-12">Keine Daten vorhanden</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API usage */}
        <TabsContent value="api" className="mt-4 space-y-6">
          <Card className="bg-card/80 backdrop-blur border-border/40">
            <CardHeader>
              <CardTitle className="text-lg">API Calls nach Service</CardTitle>
            </CardHeader>
            <CardContent>
              {apiLoading ? <Skeleton className="h-72 w-full" /> : apiUsage && apiUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={apiUsage} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="calls" name="Calls" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-12">Keine API-Daten</p>
              )}
            </CardContent>
          </Card>

          {/* API detail cards */}
          {apiUsage && apiUsage.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {apiUsage.map(api => (
                <Card key={api.name} className="bg-card/80 border-border/40">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold text-foreground capitalize">{api.name}</p>
                    <p className="text-2xl font-bold text-foreground tabular-nums mt-1">{api.calls}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>€{api.cost}</span>
                      <Badge variant="outline" className="text-xs">
                        {api.cacheRate}% Cache
                      </Badge>
                    </div>
                    {api.avgTime > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">⌀ {api.avgTime}ms</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const SummaryCard: React.FC<{ icon: React.ElementType; label: string; value: number; color: string; loading: boolean }> = ({
  icon: Icon, label, value, color, loading,
}) => (
  <Card className="bg-card/80 backdrop-blur border-border/40">
    <CardContent className="pt-5 pb-4">
      <div className="flex items-center gap-3">
        <Icon className={`w-6 h-6 ${color} flex-shrink-0`} />
        <div className="min-w-0">
          {loading ? <Skeleton className="h-7 w-16" /> : (
            <p className="text-xl font-bold text-foreground tabular-nums">{value.toLocaleString('de-DE')}</p>
          )}
          <p className="text-xs text-muted-foreground truncate">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AdminAnalytics;
