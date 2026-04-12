import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/config/queryConfig';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Ticket, DollarSign, TrendingUp, Activity, ShieldCheck, ShieldAlert, Database, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface PlatformStats {
  totalUsers: number;
  totalDates: number;
  activeDates: number;
  completedDates: number;
  totalVouchers: number;
  totalRedemptions: number;
  totalApiCalls: number;
  estimatedApiCost: number;
  verifiedPartners: number;
  pendingPartners: number;
}

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();

  const { data: stats, isLoading } = useQuery<PlatformStats>({
    queryKey: ['admin-platform-stats'],
    queryFn: async () => {
      const [
        profilesRes,
        invitationsRes,
        activeInvRes,
        completedInvRes,
        vouchersRes,
        redemptionsRes,
        apiLogsRes,
        verifiedPartnersRes,
        pendingPartnersRes,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('date_invitations').select('id', { count: 'exact', head: true }),
        supabase.from('date_invitations').select('id', { count: 'exact', head: true }).eq('date_status', 'scheduled'),
        supabase.from('date_invitations').select('id', { count: 'exact', head: true }).eq('date_status', 'completed'),
        supabase.from('vouchers').select('id', { count: 'exact', head: true }),
        supabase.from('voucher_redemptions').select('id', { count: 'exact', head: true }),
        supabase.from('api_usage_logs').select('estimated_cost'),
        supabase.from('partner_profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'verified'),
        supabase.from('partner_profiles').select('id', { count: 'exact', head: true }).in('verification_status', ['pending_review', 'unverified']),
      ]);

      const totalApiCost = (apiLogsRes.data || []).reduce((sum, r) => sum + (Number(r.estimated_cost) || 0), 0);

      return {
        totalUsers: profilesRes.count || 0,
        totalDates: invitationsRes.count || 0,
        activeDates: activeInvRes.count || 0,
        completedDates: completedInvRes.count || 0,
        totalVouchers: vouchersRes.count || 0,
        totalRedemptions: redemptionsRes.count || 0,
        totalApiCalls: (apiLogsRes.data || []).length,
        estimatedApiCost: Math.round(totalApiCost * 100) / 100,
        verifiedPartners: verifiedPartnersRes.count || 0,
        pendingPartners: pendingPartnersRes.count || 0,
      };
    },
    staleTime: STALE_TIMES.ADMIN,
  });

  const kpiCards = [
    { label: t('admin.totalUsers', 'Registrierte Nutzer'), value: stats?.totalUsers ?? 0, icon: Users, color: 'text-blue-400' },
    { label: t('admin.totalDates', 'Geplante Dates'), value: stats?.totalDates ?? 0, icon: Calendar, color: 'text-pink-400' },
    { label: t('admin.activeDates', 'Aktive Dates'), value: stats?.activeDates ?? 0, icon: TrendingUp, color: 'text-green-400' },
    { label: t('admin.completedDates', 'Abgeschlossene Dates'), value: stats?.completedDates ?? 0, icon: Activity, color: 'text-purple-400' },
    { label: t('admin.totalVouchers', 'Vouchers'), value: stats?.totalVouchers ?? 0, icon: Ticket, color: 'text-amber-400' },
    { label: t('admin.voucherRedemptions', 'Einlösungen'), value: stats?.totalRedemptions ?? 0, icon: Ticket, color: 'text-orange-400' },
    { label: t('admin.apiCalls', 'API Calls'), value: stats?.totalApiCalls ?? 0, icon: Activity, color: 'text-cyan-400' },
    { label: t('admin.apiCost', 'API Kosten (€)'), value: `€${stats?.estimatedApiCost ?? 0}`, icon: DollarSign, color: 'text-red-400' },
    { label: t('admin.verifiedPartners', 'Verifizierte Partner'), value: stats?.verifiedPartners ?? 0, icon: ShieldCheck, color: 'text-emerald-400' },
    { label: t('admin.pendingPartners', 'Offene Verifizierungen'), value: stats?.pendingPartners ?? 0, icon: ShieldAlert, color: 'text-yellow-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('admin.dashboardTitle', 'Admin Dashboard')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('admin.dashboardSubtitle', 'Plattform-Übersicht und wichtige Kennzahlen')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.label} className="bg-card/80 backdrop-blur border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Quality */}
      <DataQualityCard />

      {/* Recent activity */}
      <RecentActivity />
    </div>
  );
};

const RecentActivity: React.FC = () => {
  const { t } = useTranslation();

  const { data: recentDates, isLoading } = useQuery({
    queryKey: ['admin-recent-dates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('date_invitations')
        .select('id, title, status, date_status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    staleTime: STALE_TIMES.ADMIN,
  });

  return (
    <Card className="bg-card/80 backdrop-blur border-border/40">
      <CardHeader>
        <CardTitle className="text-lg">{t('admin.recentActivity', 'Letzte Aktivitäten')}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : recentDates && recentDates.length > 0 ? (
          <div className="space-y-2">
            {recentDates.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium text-foreground">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  d.date_status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  d.date_status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {d.date_status || d.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('admin.noActivity', 'Keine Aktivitäten vorhanden')}</p>
        )}
      </CardContent>
    </Card>
  );
};

const DataQualityCard: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    summary?: {
      total_validated: number;
      avg_quality_score: number;
      issues_found: number;
      critical_issues: number;
      name_mismatches: number;
      location_mismatches: number;
    };
  } | null>(null);

  const runValidation = async (dryRun: boolean) => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-venue-data', {
        body: { limit: 50, dry_run: dryRun },
      });
      if (error) throw error;
      setResult(data);
      toast.success(
        `${data.summary.total_validated} Venues geprüft – Durchschnitt: ${data.summary.avg_quality_score}%`
      );
    } catch (err: any) {
      toast.error(`Validierung fehlgeschlagen: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-border/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Database className="w-5 h-5 text-primary" />
          Datenqualität – Venues
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => runValidation(true)}
            disabled={isRunning}
          >
            {isRunning && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Prüfen (Dry Run)
          </Button>
          <Button
            size="sm"
            onClick={() => runValidation(false)}
            disabled={isRunning}
          >
            {isRunning && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Prüfen & Speichern
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {result?.summary ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Geprüft', value: result.summary.total_validated },
              { label: 'Ø Score', value: `${result.summary.avg_quality_score}%` },
              { label: 'Mit Issues', value: result.summary.issues_found },
              { label: 'Kritisch', value: result.summary.critical_issues, critical: true },
              { label: 'Name-Mismatch', value: result.summary.name_mismatches },
              { label: 'Ort-Mismatch', value: result.summary.location_mismatches },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-lg bg-muted/30 text-center">
                <p className={`text-xl font-bold ${item.critical && Number(item.value) > 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {item.value}
                </p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Klicke auf "Prüfen", um die Datenqualität aller Venues zu validieren. Ein wöchentlicher Cron-Job läuft automatisch.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminDashboard;
