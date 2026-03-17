import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Bug, Wifi, Gauge, Clock, AlertCircle } from 'lucide-react';

type ErrorType = 'js_error' | 'api_error' | 'ui_error' | 'performance' | 'all';

const severityColors: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  error: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const typeIcons: Record<string, React.ReactNode> = {
  js_error: <Bug className="w-4 h-4" />,
  api_error: <Wifi className="w-4 h-4" />,
  ui_error: <AlertTriangle className="w-4 h-4" />,
  performance: <Gauge className="w-4 h-4" />,
};

const AdminErrors: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ErrorType>('all');

  const { data: errors, isLoading } = useQuery({
    queryKey: ['admin-error-logs', activeTab],
    queryFn: async () => {
      let query = supabase
        .from('error_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (activeTab !== 'all') {
        query = query.eq('error_type', activeTab);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
    staleTime: 30_000,
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-error-stats'],
    queryFn: async () => {
      const { data } = await supabase
        .from('error_logs' as any)
        .select('error_type, severity')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const counts = { total: 0, critical: 0, js_error: 0, api_error: 0, ui_error: 0, performance: 0 };
      ((data as any[]) || []).forEach((e: any) => {
        counts.total++;
        if (e.severity === 'critical') counts.critical++;
        if (e.error_type in counts) (counts as any)[e.error_type]++;
      });
      return counts;
    },
    staleTime: 30_000,
  });

  const statCards = [
    { label: 'Letzte 24h', value: stats?.total ?? 0, icon: Clock, color: 'text-blue-400' },
    { label: 'Kritisch', value: stats?.critical ?? 0, icon: AlertCircle, color: 'text-red-400' },
    { label: 'JS Errors', value: stats?.js_error ?? 0, icon: Bug, color: 'text-orange-400' },
    { label: 'API Errors', value: stats?.api_error ?? 0, icon: Wifi, color: 'text-purple-400' },
    { label: 'UI Errors', value: stats?.ui_error ?? 0, icon: AlertTriangle, color: 'text-amber-400' },
    { label: 'Performance', value: stats?.performance ?? 0, icon: Gauge, color: 'text-cyan-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('admin.errorsTitle', 'Error Monitoring')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('admin.errorsSubtitle', 'Fehler und Performance-Probleme im Überblick')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className="bg-card/80 border-border/40">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ErrorType)}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="js_error">JS</TabsTrigger>
          <TabsTrigger value="api_error">API</TabsTrigger>
          <TabsTrigger value="ui_error">UI</TabsTrigger>
          <TabsTrigger value="performance">Perf</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : errors && errors.length > 0 ? (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3">
                {errors.map((err: any) => (
                  <Card key={err.id} className="bg-card/80 border-border/40">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {typeIcons[err.error_type] || <Bug className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="outline" className={`text-xs ${severityColors[err.severity] || ''}`}>
                              {err.severity}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {err.error_type}
                            </Badge>
                            {err.route && (
                              <span className="text-xs text-muted-foreground font-mono">{err.route}</span>
                            )}
                          </div>
                          <p className="text-sm text-foreground break-all">{err.error_message}</p>
                          {err.component_name && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Component: <span className="font-mono">{err.component_name}</span>
                            </p>
                          )}
                          {err.error_stack && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                Stack Trace
                              </summary>
                              <pre className="text-xs text-muted-foreground mt-1 p-2 bg-muted/30 rounded overflow-x-auto max-h-32">
                                {err.error_stack}
                              </pre>
                            </details>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(err.created_at).toLocaleString('de-DE')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <Card className="bg-card/80 border-border/40">
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Keine Fehler gefunden ✓</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminErrors;
