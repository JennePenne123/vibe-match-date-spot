import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { STALE_TIMES } from '@/config/queryConfig';
import { Clock, CheckCircle2, XCircle, AlertCircle, Pause } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface CronJobStatus {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  last_run_start: string | null;
  last_run_end: string | null;
  last_run_status: string | null;
  last_run_message: string | null;
  total_runs_24h: number;
  failed_runs_24h: number;
}

// Cron-Schedule → menschenlesbar (DE)
function describeSchedule(schedule: string): string {
  const map: Record<string, string> = {
    '* * * * *': 'Jede Minute',
    '*/30 * * * *': 'Alle 30 Min',
    '0 * * * *': 'Stündlich',
    '0 */4 * * *': 'Alle 4 Std',
    '0 3 * * *': 'Täglich 03:00',
    '0 4 * * *': 'Täglich 04:00',
    '15 4 * * *': 'Täglich 04:15',
    '0 5 * * *': 'Täglich 05:00',
    '0 9 * * *': 'Täglich 09:00',
    '0 5 1 * *': 'Monatlich, 1. um 05:00',
    '0 3 * * 0': 'Wöchentlich (So 03:00)',
  };
  return map[schedule] ?? schedule;
}

export const CronJobsWidget: React.FC = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-cron-jobs-status'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cron_jobs_status');
      if (error) throw error;
      return (data || []) as CronJobStatus[];
    },
    staleTime: STALE_TIMES.ADMIN,
    refetchInterval: 60_000, // Refresh jede Minute
  });

  const totalJobs = data?.length ?? 0;
  const activeJobs = data?.filter(j => j.active).length ?? 0;
  const failedRecently = data?.filter(j => (j.failed_runs_24h ?? 0) > 0).length ?? 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-primary" />
            Cron-Jobs Status
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="outline" className="border-border">
              {activeJobs}/{totalJobs} aktiv
            </Badge>
            {failedRecently > 0 ? (
              <Badge variant="destructive">
                {failedRecently} mit Fehlern (24h)
              </Badge>
            ) : (
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                Alle gesund
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            Konnte Cron-Status nicht laden: {(error as Error).message}
          </div>
        )}

        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">Keine Cron-Jobs gefunden.</p>
        )}

        {data && data.length > 0 && (
          <ScrollArea className="h-[420px] pr-2">
            <ul className="space-y-2">
              {data.map((job) => {
                const isFailed = job.last_run_status === 'failed';
                const isOk = job.last_run_status === 'succeeded';
                const lastRunRel = job.last_run_start
                  ? formatDistanceToNow(new Date(job.last_run_start), { addSuffix: true, locale: de })
                  : 'Noch nie';

                return (
                  <li
                    key={job.jobid}
                    className="rounded-md border border-border bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {!job.active ? (
                            <Pause className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          ) : isFailed ? (
                            <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                          ) : isOk ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="font-medium text-sm text-foreground truncate">
                            {job.jobname}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {describeSchedule(job.schedule)} · letzter Lauf: {lastRunRel}
                        </p>
                        {job.last_run_message && isFailed && (
                          <p className="text-xs text-destructive mt-1 truncate" title={job.last_run_message}>
                            {job.last_run_message}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {!job.active && (
                          <Badge variant="outline" className="text-xs border-border">
                            Pausiert
                          </Badge>
                        )}
                        {job.active && job.failed_runs_24h > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {job.failed_runs_24h} Fehler / 24h
                          </Badge>
                        )}
                        {job.active && job.failed_runs_24h === 0 && job.total_runs_24h > 0 && (
                          <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                            {job.total_runs_24h}× OK
                          </Badge>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
