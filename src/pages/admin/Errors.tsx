import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/config/queryConfig';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Bug, Wifi, Gauge, Clock, AlertCircle, Wand2, CheckCircle2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type ErrorType = 'js_error' | 'api_error' | 'ui_error' | 'performance' | 'all';
type StatusFilter = 'all' | 'open' | 'resolved';
type DateRange = 'all' | '24h' | '7d' | '30d';

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [resolveTarget, setResolveTarget] = useState<any | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const openResolve = (err: any) => {
    setResolveTarget(err);
    setResolveNote(err.resolution_note || '');
  };

  const submitResolve = async () => {
    if (!resolveTarget) return;
    setResolving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('error_logs' as any)
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: user?.id ?? null,
        resolution_note: resolveNote.trim() || null,
      } as any)
      .eq('id', resolveTarget.id);
    setResolving(false);
    if (error) {
      toast.error('Konnte nicht als behoben markiert werden', { description: error.message });
      return;
    }
    toast.success('Als behoben markiert');
    setResolveTarget(null);
    setResolveNote('');
    queryClient.invalidateQueries({ queryKey: ['admin-error-logs'] });
    queryClient.invalidateQueries({ queryKey: ['admin-error-stats'] });
  };

  const reopen = async (err: any) => {
    const { error } = await supabase
      .from('error_logs' as any)
      .update({ resolved: false, resolved_at: null, resolved_by: null } as any)
      .eq('id', err.id);
    if (error) {
      toast.error('Fehler', { description: error.message });
      return;
    }
    toast.success('Wieder geöffnet');
    queryClient.invalidateQueries({ queryKey: ['admin-error-logs'] });
  };

  const copyFixPrompt = async (err: any) => {
    const prompt = [
      `Fix this error in the H!Outz app:`,
      ``,
      `**Type:** ${err.error_type}`,
      `**Severity:** ${err.severity}`,
      `**Message:** ${err.error_message}`,
      err.route ? `**Route:** ${err.route}` : null,
      err.component_name ? `**Component:** ${err.component_name}` : null,
      err.user_agent ? `**User-Agent:** ${err.user_agent}` : null,
      `**Occurred:** ${new Date(err.created_at).toISOString()}`,
      err.error_stack ? `\n**Stack Trace:**\n\`\`\`\n${err.error_stack}\n\`\`\`` : null,
      err.metadata ? `\n**Metadata:**\n\`\`\`json\n${JSON.stringify(err.metadata, null, 2)}\n\`\`\`` : null,
      ``,
      `Please diagnose the root cause and implement a fix.`,
    ].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success('Fix-Prompt in Zwischenablage kopiert', {
        description: 'Füge ihn in den Lovable-Chat ein.',
      });
    } catch {
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  // Debounce search input
  React.useEffect(() => {
    const h = setTimeout(() => setSearchTerm(searchInput.trim()), 300);
    return () => clearTimeout(h);
  }, [searchInput]);

  const rangeSince = (r: DateRange): string | null => {
    const now = Date.now();
    if (r === '24h') return new Date(now - 24 * 3600 * 1000).toISOString();
    if (r === '7d') return new Date(now - 7 * 24 * 3600 * 1000).toISOString();
    if (r === '30d') return new Date(now - 30 * 24 * 3600 * 1000).toISOString();
    return null;
  };

  const { data: errors, isLoading } = useQuery({
    queryKey: ['admin-error-logs', activeTab, statusFilter, dateRange, searchTerm],
    queryFn: async () => {
      let query: any = supabase
        .from('error_logs' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (activeTab !== 'all') query = query.eq('error_type', activeTab);
      if (statusFilter === 'open') query = query.eq('resolved', false);
      if (statusFilter === 'resolved') query = query.eq('resolved', true);

      const since = rangeSince(dateRange);
      if (since) query = query.gte('created_at', since);

      if (searchTerm) {
        const esc = searchTerm.replace(/[%,]/g, ' ');
        query = query.or(
          `error_message.ilike.%${esc}%,route.ilike.%${esc}%,component_name.ilike.%${esc}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as any[];
    },
    staleTime: STALE_TIMES.REALTIME,
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
    staleTime: STALE_TIMES.REALTIME,
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
                            {err.resolved && (
                              <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                behoben
                              </Badge>
                            )}
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
                          {err.resolved && err.resolution_note && (
                            <div className="mt-2 p-2 rounded bg-green-500/5 border border-green-500/20">
                              <p className="text-xs text-green-400 font-medium mb-0.5">Notiz</p>
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{err.resolution_note}</p>
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => copyFixPrompt(err)}
                            title="Fix-Prompt in Zwischenablage kopieren"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Fix this error</span>
                          </Button>
                          {err.resolved ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1.5 text-muted-foreground"
                              onClick={() => reopen(err)}
                            >
                              Wieder öffnen
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 border-green-500/30 text-green-400 hover:bg-green-500/10"
                              onClick={() => openResolve(err)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Behoben</span>
                            </Button>
                          )}
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

      <Dialog open={!!resolveTarget} onOpenChange={(o) => !o && setResolveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fehler als behoben markieren</DialogTitle>
            <DialogDescription className="break-all">
              {resolveTarget?.error_message}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Notiz (optional)</label>
            <Textarea
              placeholder="Was wurde gemacht? z.B. Fix in Commit …, Ursache war …"
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResolveTarget(null)} disabled={resolving}>
              Abbrechen
            </Button>
            <Button onClick={submitResolve} disabled={resolving} className="gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Als behoben markieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminErrors;
