import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ScrollText, AlertTriangle, Copy } from 'lucide-react';

interface AuditSummary {
  window_days: number;
  totals: Record<string, number>;
  by_severity: Record<string, number>;
  top_failing_tags: Array<{
    tag_key: string; tag_value: string; failures: number; cities: number; last_seen: string;
  }>;
  top_failing_cities: Array<{
    city: string; category: string | null; failures: number; last_seen: string;
  }>;
  recent: Array<{
    event_type: string; severity: string; city: string | null; category: string | null;
    tag_key: string | null; tag_value: string | null; dedupe_key: string | null;
    message: string | null; created_at: string;
  }>;
}

interface DuplicateCandidate {
  normalized_name: string;
  latitude: number;
  longitude: number;
  venue_count: number;
  venue_ids: string[];
  venue_names: string[];
}

const WINDOWS = [1, 7, 30];

const SEVERITY_STYLE: Record<string, string> = {
  error: 'bg-destructive/15 text-destructive border-destructive/30',
  warn: 'bg-accent/15 text-accent border-accent/30',
  info: 'bg-muted text-muted-foreground border-border',
};

const EVENT_LABEL: Record<string, string> = {
  overpass_unreachable: 'Datenquelle nicht erreichbar',
  tag_skipped: 'Ortstyp übersprungen',
  tag_processed: 'Ortstyp verarbeitet',
  upsert_failed: 'Speichern fehlgeschlagen',
  duplicate_in_batch: 'Dublette in Abfrage',
  duplicate_existing_reused: 'Bestehender Ort aktualisiert',
  duplicate_merged: 'Dublette zusammengeführt',
  job_failed: 'Auftrag fehlgeschlagen',
  job_retry: 'Auftrag wird wiederholt',
  job_done: 'Auftrag fertig',
  jobs_requeued: 'Aufträge neu eingereiht',
  self_invoke_failed: 'Fortsetzung fehlgeschlagen',
  worker_crashed: 'Import abgebrochen',
};

const time = (iso: string) =>
  new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function ImportAuditWidget() {
  const [days, setDays] = useState(7);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-import-audit', days],
    queryFn: async () => {
      const { data: summary, error } = await supabase.rpc('get_import_audit_summary', { days_back: days });
      if (error) throw error;
      return summary as unknown as AuditSummary;
    },
    refetchInterval: 60_000,
  });

  const { data: duplicates } = useQuery({
    queryKey: ['admin-duplicate-candidates'],
    queryFn: async () => {
      const { data: rows, error } = await supabase.rpc('get_duplicate_candidates', { _limit: 25 });
      if (error) throw error;
      return (rows ?? []) as unknown as DuplicateCandidate[];
    },
    refetchInterval: 120_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Import-Protokoll wird geladen…
        </CardContent>
      </Card>
    );
  }

  const totals = data?.totals ?? {};
  const sev = data?.by_severity ?? {};
  const errors = sev.error ?? 0;
  const warns = sev.warn ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ScrollText className="h-4 w-4 text-primary" />
          Import-Protokoll & Dubletten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {WINDOWS.map((d) => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? 'default' : 'outline'}
              onClick={() => setDays(d)}
            >
              {d} {d === 1 ? 'Tag' : 'Tage'}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-border bg-muted/40 p-2">
            <p className="text-lg font-semibold text-destructive">{errors}</p>
            <p className="text-xs text-muted-foreground">Fehler</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-2">
            <p className="text-lg font-semibold">{warns}</p>
            <p className="text-xs text-muted-foreground">Warnungen</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-2">
            <p className="text-lg font-semibold">
              {(totals.duplicate_merged ?? 0) + (totals.duplicate_in_batch ?? 0) + (totals.duplicate_existing_reused ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">Dubletten</p>
          </div>
        </div>

        {(data?.top_failing_tags?.length ?? 0) > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Problematische Ortstypen</p>
            {data!.top_failing_tags.slice(0, 5).map((t) => (
              <div key={`${t.tag_key}-${t.tag_value}`} className="flex items-center justify-between text-sm">
                <span className="truncate font-mono text-xs">{t.tag_key}={t.tag_value}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {t.failures}× · {t.cities} Städte
                </span>
              </div>
            ))}
          </div>
        )}

        {(data?.top_failing_cities?.length ?? 0) > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Problematische Städte</p>
            {data!.top_failing_cities.slice(0, 5).map((c) => (
              <div key={`${c.city}-${c.category}`} className="flex items-center justify-between text-sm">
                <span className="truncate">{c.city}<span className="text-muted-foreground"> · {c.category}</span></span>
                <span className="shrink-0 text-xs text-muted-foreground">{c.failures}×</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Letzte Ereignisse</p>
          <ScrollArea className="h-56 rounded-lg border border-border">
            <div className="divide-y divide-border">
              {(data?.recent ?? []).map((e, i) => (
                <div key={`${e.created_at}-${i}`} className="space-y-1 p-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] ${SEVERITY_STYLE[e.severity] ?? ''}`}>
                      {EVENT_LABEL[e.event_type] ?? e.event_type}
                    </Badge>
                    <span className="ml-auto text-[10px] text-muted-foreground">{time(e.created_at)}</span>
                  </div>
                  <p className="text-xs text-foreground">{e.message}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {[e.city, e.category, e.tag_key && `${e.tag_key}=${e.tag_value}`, e.dedupe_key]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              ))}
              {(data?.recent?.length ?? 0) === 0 && (
                <p className="p-3 text-xs text-muted-foreground">Keine Ereignisse im gewählten Zeitraum.</p>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-1">
          <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <AlertTriangle className="h-3 w-3" />
            Verdächtige Dubletten ({duplicates?.length ?? 0})
          </p>
          {(duplicates ?? []).slice(0, 8).map((d) => (
            <div
              key={`${d.normalized_name}-${d.latitude}-${d.longitude}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-border p-2"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{d.venue_names.join(' / ')}</p>
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  {d.normalized_name}@{d.latitude},{d.longitude}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0"
                aria-label="Orts-IDs kopieren"
                onClick={() => navigator.clipboard.writeText(d.venue_ids.join(', '))}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {(duplicates?.length ?? 0) === 0 && (
            <p className="text-xs text-muted-foreground">Keine offenen Dubletten gefunden.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
