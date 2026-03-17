import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#f87171', '#60a5fa'];

const AdminAnalytics: React.FC = () => {
  const { t } = useTranslation();

  const { data: apiUsage, isLoading: apiLoading } = useQuery({
    queryKey: ['admin-api-usage'],
    queryFn: async () => {
      const { data } = await supabase
        .from('api_usage_logs')
        .select('api_name, estimated_cost, cache_hit, created_at')
        .order('created_at', { ascending: false })
        .limit(500);

      const byApi = new Map<string, { calls: number; cost: number; cacheHits: number }>();
      (data || []).forEach((log) => {
        const existing = byApi.get(log.api_name) || { calls: 0, cost: 0, cacheHits: 0 };
        existing.calls++;
        existing.cost += Number(log.estimated_cost) || 0;
        if (log.cache_hit) existing.cacheHits++;
        byApi.set(log.api_name, existing);
      });

      return Array.from(byApi.entries()).map(([name, stats]) => ({
        name,
        ...stats,
        cost: Math.round(stats.cost * 1000) / 1000,
      }));
    },
    staleTime: 60_000,
  });

  const { data: datesByStatus, isLoading: datesLoading } = useQuery({
    queryKey: ['admin-dates-by-status'],
    queryFn: async () => {
      const { data } = await supabase
        .from('date_invitations')
        .select('date_status, status');

      const statusCount = new Map<string, number>();
      (data || []).forEach((d) => {
        const status = d.date_status || d.status || 'unknown';
        statusCount.set(status, (statusCount.get(status) || 0) + 1);
      });

      return Array.from(statusCount.entries()).map(([name, value]) => ({ name, value }));
    },
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('admin.analyticsTitle', 'Analytics')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('admin.analyticsSubtitle', 'Detaillierte Plattform-Statistiken')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Usage Chart */}
        <Card className="bg-card/80 backdrop-blur border-border/40">
          <CardHeader>
            <CardTitle className="text-lg">{t('admin.apiUsageChart', 'API-Nutzung nach Service')}</CardTitle>
          </CardHeader>
          <CardContent>
            {apiLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : apiUsage && apiUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={apiUsage}>
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">Keine API-Daten vorhanden</p>
            )}
          </CardContent>
        </Card>

        {/* Dates by Status Pie */}
        <Card className="bg-card/80 backdrop-blur border-border/40">
          <CardHeader>
            <CardTitle className="text-lg">{t('admin.datesByStatus', 'Dates nach Status')}</CardTitle>
          </CardHeader>
          <CardContent>
            {datesLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : datesByStatus && datesByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={datesByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name}: ${value}`}>
                    {datesByStatus.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">Keine Date-Daten vorhanden</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* API Cost Breakdown */}
      {apiUsage && apiUsage.length > 0 && (
        <Card className="bg-card/80 backdrop-blur border-border/40">
          <CardHeader>
            <CardTitle className="text-lg">{t('admin.apiCostBreakdown', 'API-Kosten Übersicht')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {apiUsage.map((api) => (
                <div key={api.name} className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm font-medium text-foreground">{api.name}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{api.calls}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">€{api.cost}</span>
                    <span className="text-xs text-green-400">
                      {api.cacheHits} Cache-Hits
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminAnalytics;
