import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert, Clock, Activity } from 'lucide-react';

const SystemHealth: React.FC = () => {
  const { t } = useTranslation();

  const { data: rateLimitData, isLoading: rlLoading } = useQuery({
    queryKey: ['admin-rate-limits'],
    queryFn: async () => {
      const { data } = await supabase
        .from('request_logs')
        .select('function_name, was_rate_limited, abuse_score, timestamp')
        .order('timestamp', { ascending: false })
        .limit(100);
      return data || [];
    },
    staleTime: 60_000,
  });

  const { data: staleSessions, isLoading: sessLoading } = useQuery({
    queryKey: ['admin-stale-sessions'],
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

  const blockedRequests = (rateLimitData || []).filter((r) => r.was_rate_limited);
  const highAbuse = (rateLimitData || []).filter((r) => (r.abuse_score || 0) > 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('admin.systemHealthTitle', 'System Health')}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t('admin.systemHealthSubtitle', 'Rate-Limits, Sessions und Systemstatus')}</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card/80 border-border/40">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">{blockedRequests.length}</p>
                <p className="text-xs text-muted-foreground">Rate-Limited Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border/40">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">{highAbuse.length}</p>
                <p className="text-xs text-muted-foreground">High Abuse Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border/40">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-foreground">{(staleSessions || []).length}</p>
                <p className="text-xs text-muted-foreground">Aktive/Abgelaufene Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rate-limited requests */}
      <Card className="bg-card/80 border-border/40">
        <CardHeader>
          <CardTitle className="text-lg">Rate-Limited Requests (letzte 100)</CardTitle>
        </CardHeader>
        <CardContent>
          {rlLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : blockedRequests.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {blockedRequests.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                    <div>
                      <p className="text-sm font-medium text-foreground">{req.function_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.timestamp && new Date(req.timestamp).toLocaleString('de-DE')}
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Abuse: {req.abuse_score}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Keine blockierten Requests ✓</p>
          )}
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card className="bg-card/80 border-border/40">
        <CardHeader>
          <CardTitle className="text-lg">Planning Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (staleSessions || []).length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {(staleSessions || []).map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-xs font-mono text-foreground">{s.id.slice(0, 8)}…</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.updated_at).toLocaleString('de-DE')}
                      </p>
                    </div>
                    <Badge variant={s.session_status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {s.session_status}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Keine Sessions gefunden</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemHealth;
