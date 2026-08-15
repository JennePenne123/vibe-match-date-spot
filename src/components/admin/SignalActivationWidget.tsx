import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { STALE_TIMES } from '@/config/queryConfig';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { Target, Info, Sparkles, Hourglass } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface SignalActivationMetrics {
  threshold: number;
  window_days: number;
  cohort_size: number;
  activated: number;
  activation_rate: number;
  avg_signals: number;
  median_signals: number;
  pending_cohort: number;
  distribution: { bucket: string; users: number }[];
  rolling: { users_with_signals: number; users_activated: number; total_signals: number };
  weekly: { week: string; cohort_size: number; activated: number; rate: number | null }[];
}

const tooltipStyle = {
  contentStyle: { background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' },
  labelStyle: { color: 'hsl(var(--foreground))' },
};

/**
 * North-Star activation widget: share of users reaching >= 5 AI signals
 * within their first 30 days. Server-aggregated via admin-only RPC.
 */
const SignalActivationWidget: React.FC<{ daysBack?: number }> = ({ daysBack = 30 }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-signal-activation', daysBack],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'get_signal_activation_metrics' as never,
        { days_back: daysBack } as never,
      );
      if (error) throw error;
      return data as unknown as SignalActivationMetrics;
    },
    staleTime: STALE_TIMES.ADMIN_ANALYTICS,
    refetchInterval: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <Skeleton className="h-80 w-full" />;
  }

  if (error || !data) {
    return (
      <Card className="bg-card/80 border-border/40">
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Aktivierungs-Kennzahl konnte nicht geladen werden.
        </CardContent>
      </Card>
    );
  }

  const weekly = (data.weekly || []).map((w) => ({
    ...w,
    rate: w.rate ?? 0,
    label: format(new Date(w.week), 'dd. MMM', { locale: de }),
  }));

  const tone =
    data.cohort_size === 0 ? 'text-muted-foreground'
      : data.activation_rate >= 40 ? 'text-emerald-500'
      : data.activation_rate >= 20 ? 'text-amber-500'
      : 'text-red-500';

  return (
    <Card className="bg-card/80 backdrop-blur border-border/40">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Aktivierung: ≥{data.threshold} Signale in {data.window_days} Tagen
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Die Kennzahl, ab der die Personalisierung spürbar besser wird als eine Redaktionsliste.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Headline KPI */}
        <div className="rounded-lg border border-border/40 bg-background/40 p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className={`text-4xl font-bold tabular-nums ${tone}`}>
                {data.cohort_size === 0 ? '–' : `${data.activation_rate}%`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {data.activated} von {data.cohort_size} Nutzern der abgeschlossenen Kohorte
              </p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              Ø {data.avg_signals} · Median {data.median_signals}
            </Badge>
          </div>
          <Progress value={data.cohort_size === 0 ? 0 : data.activation_rate} className="h-2 mt-3" />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MiniStat icon={Sparkles} label="Aktiviert (rollierend)" value={data.rolling.users_activated}
            sub={`${data.rolling.users_with_signals} Nutzer mit Signalen`} />
          <MiniStat icon={Target} label="Signale gesamt" value={data.rolling.total_signals}
            sub={`letzte ${data.window_days} Tage`} />
          <MiniStat icon={Hourglass} label="Noch im Fenster" value={data.pending_cohort}
            sub="zu jung für die Wertung" />
        </div>

        {/* Distribution */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Signal-Verteilung der Kohorte</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.distribution || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="bucket" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="users" name="Nutzer" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly trend */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Wöchentlicher Trend (nach Anmeldewoche)</p>
          {weekly.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis unit="%" domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Legend />
                <Bar dataKey="rate" name="Aktivierungsrate %" fill="hsl(160 60% 50%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-10">Noch keine abgeschlossene Kohorte</p>
          )}
        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          Signal = Venue-Feedback (Like/Dislike/Favorit), Date-Bewertung oder bewerteter KI-Lerndatensatz.
          Gewertet werden nur Nutzer, deren erste {data.window_days} Tage bereits vorbei sind.
        </p>
      </CardContent>
    </Card>
  );
};

const MiniStat: React.FC<{ icon: React.ElementType; label: string; value: number; sub?: string }> = ({
  icon: Icon, label, value, sub,
}) => (
  <div className="rounded-lg border border-border/40 bg-background/40 p-3 flex items-center gap-3">
    <Icon className="w-5 h-5 text-primary flex-shrink-0" />
    <div className="min-w-0">
      <p className="text-xl font-bold text-foreground tabular-nums">{value.toLocaleString('de-DE')}</p>
      <p className="text-xs text-muted-foreground truncate">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground/80 truncate">{sub}</p>}
    </div>
  </div>
);

export default SignalActivationWidget;
