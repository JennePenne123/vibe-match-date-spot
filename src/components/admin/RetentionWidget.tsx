import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/config/queryConfig';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Legend,
} from 'recharts';
import { Repeat, Activity, TrendingUp, UserCheck, Info } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface RetentionMetrics {
  retention: {
    d1_rate: number; d7_rate: number; d30_rate: number;
    base_d1: number; base_d7: number; base_d30: number;
    ret_d1: number; ret_d7: number; ret_d30: number;
  };
  stickiness: { dau: number; wau: number; mau: number; dau_mau: number };
  reactivated: number;
  daily: { day: string; active: number }[];
  cohorts: { week: string; size: number; d1: number; d7: number; d30: number }[];
}

const tooltipStyle = {
  contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' },
  labelStyle: { color: 'hsl(var(--foreground))' },
};

/**
 * Retention / Activation Widget – the investor- & self-analysis dashboard.
 * Reads cohort retention (D1/D7/D30), stickiness (DAU/WAU/MAU) and reactivated
 * users from the `get_retention_metrics` RPC (admin-only, server-side aggregated).
 */
export const RetentionWidget: React.FC<{ daysBack: number }> = ({ daysBack }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-retention-metrics', daysBack],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'get_retention_metrics' as never,
        { days_back: daysBack } as never,
      );
      if (error) throw error;
      return data as unknown as RetentionMetrics;
    },
    staleTime: STALE_TIMES.ADMIN_ANALYTICS,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="bg-card/80 border-border/40">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Retention-Daten konnten nicht geladen werden.
        </CardContent>
      </Card>
    );
  }

  const { retention, stickiness, reactivated, daily, cohorts } = data;

  const dailyChart = (daily || []).map(d => ({
    ...d,
    label: format(new Date(d.day), 'dd. MMM', { locale: de }),
  }));

  const cohortChart = (cohorts || []).map(c => ({
    ...c,
    label: format(new Date(c.week), 'dd. MMM', { locale: de }),
  }));

  return (
    <div className="space-y-6">
      {/* Retention KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RetentionCard label="D1 Retention" rate={retention.d1_rate} retained={retention.ret_d1} base={retention.base_d1} good={20} />
        <RetentionCard label="D7 Retention" rate={retention.d7_rate} retained={retention.ret_d7} base={retention.base_d7} good={10} />
        <RetentionCard label="D30 Retention" rate={retention.d30_rate} retained={retention.ret_d30} base={retention.base_d30} good={5} />
      </div>

      {/* Stickiness + reactivation */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="DAU (heute)" value={stickiness.dau} color="text-blue-500" />
        <StatCard icon={TrendingUp} label="WAU (7 Tage)" value={stickiness.wau} color="text-emerald-500" />
        <StatCard icon={UserCheck} label="MAU (30 Tage)" value={stickiness.mau} color="text-violet-500" />
        <StatCard icon={Repeat} label="Reaktiviert" value={reactivated} color="text-amber-500" sub={`DAU/MAU ${stickiness.dau_mau}%`} />
      </div>

      {/* Daily active users */}
      <Card className="bg-card/80 backdrop-blur border-border/40">
        <CardHeader>
          <CardTitle className="text-lg">Täglich aktive Nutzer</CardTitle>
        </CardHeader>
        <CardContent>
          {dailyChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="active" name="Aktiv" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">Noch keine Aktivitätsdaten</p>
          )}
        </CardContent>
      </Card>

      {/* Weekly cohort retention */}
      <Card className="bg-card/80 backdrop-blur border-border/40">
        <CardHeader>
          <CardTitle className="text-lg">Kohorten-Retention pro Anmeldewoche</CardTitle>
        </CardHeader>
        <CardContent>
          {cohortChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cohortChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis unit="%" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} domain={[0, 100]} />
                <Tooltip {...tooltipStyle} />
                <Legend />
                <Bar dataKey="d1" name="D1 %" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="d7" name="D7 %" fill="hsl(160 60% 50%)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="d30" name="D30 %" fill="hsl(330 80% 60%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">Noch keine Kohortendaten</p>
          )}
        </CardContent>
      </Card>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        Aktivität = Einladung, Date-Planung, Venue-Bewertung, Freundschaft, Feedback oder Onboarding-Schritt.
        Retention zählt nur Kohorten, die alt genug für das jeweilige Zeitfenster sind.
      </p>
    </div>
  );
};

const RetentionCard: React.FC<{ label: string; rate: number; retained: number; base: number; good: number }> = ({
  label, rate, retained, base, good,
}) => {
  const tone = base === 0 ? 'muted' : rate >= good ? 'good' : rate >= good / 2 ? 'mid' : 'low';
  const toneClass = {
    good: 'text-emerald-500',
    mid: 'text-amber-500',
    low: 'text-red-500',
    muted: 'text-muted-foreground',
  }[tone];
  return (
    <Card className="bg-card/80 backdrop-blur border-border/40">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{label}</p>
          {base > 0 && <Badge variant="outline" className="text-xs">{retained}/{base}</Badge>}
        </div>
        <p className={`text-3xl font-bold tabular-nums mt-2 ${toneClass}`}>
          {base === 0 ? '–' : `${rate}%`}
        </p>
        {base === 0 && <p className="text-xs text-muted-foreground mt-1">noch zu wenig Daten</p>}
      </CardContent>
    </Card>
  );
};

const StatCard: React.FC<{ icon: React.ElementType; label: string; value: number; color: string; sub?: string }> = ({
  icon: Icon, label, value, color, sub,
}) => (
  <Card className="bg-card/80 backdrop-blur border-border/40">
    <CardContent className="pt-5 pb-4">
      <div className="flex items-center gap-3">
        <Icon className={`w-6 h-6 ${color} flex-shrink-0`} />
        <div className="min-w-0">
          <p className="text-xl font-bold text-foreground tabular-nums">{value.toLocaleString('de-DE')}</p>
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          {sub && <p className="text-[10px] text-muted-foreground/80 truncate">{sub}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default RetentionWidget;