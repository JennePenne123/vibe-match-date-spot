import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Globe2 } from 'lucide-react';

interface JobRow {
  city: string;
  country: string;
  category: string;
  status: string;
  saved_count: number;
  chunk_offset: number;
  last_error: string | null;
  updated_at: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  food: 'Essen & Trinken',
  culture: 'Kultur',
  activity: 'Aktivitäten',
  nightlife: 'Nightlife',
};

export default function VenueImportQueueWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-venue-import-queue'],
    queryFn: async () => {
      const { data: jobs, error } = await supabase
        .from('venue_import_jobs')
        .select('city, country, category, status, saved_count, chunk_offset, last_error, updated_at')
        .order('updated_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (jobs ?? []) as JobRow[];
    },
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Import-Warteschlange wird geladen…
        </CardContent>
      </Card>
    );
  }

  const jobs = data ?? [];
  const total = jobs.length;
  const done = jobs.filter((j) => j.status === 'done').length;
  const running = jobs.filter((j) => j.status === 'running');
  const failed = jobs.filter((j) => j.status === 'failed');
  const saved = jobs.reduce((sum, j) => sum + (j.saved_count ?? 0), 0);
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  const cities = Array.from(new Set(jobs.map((j) => `${j.city}|${j.country}`)));
  const cityDone = cities.filter((c) =>
    jobs.filter((j) => `${j.city}|${j.country}` === c).every((j) => j.status === 'done'),
  ).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe2 className="h-4 w-4 text-primary" />
          Städte-Import (DACH)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted-foreground">{done} von {total} Aufträgen fertig</span>
            <span className="font-medium">{percent}%</span>
          </div>
          <Progress value={percent} />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/50 p-2">
            <div className="text-lg font-semibold">{saved.toLocaleString('de-DE')}</div>
            <div className="text-xs text-muted-foreground">Orte gespeichert</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <div className="text-lg font-semibold">{cityDone}/{cities.length}</div>
            <div className="text-xs text-muted-foreground">Städte komplett</div>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <div className="text-lg font-semibold">{failed.length}</div>
            <div className="text-xs text-muted-foreground">Fehlgeschlagen</div>
          </div>
        </div>

        {running.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Läuft gerade</p>
            {running.slice(0, 4).map((j) => (
              <div key={`${j.city}-${j.category}`} className="flex items-center justify-between text-sm">
                <span>{j.city} · {CATEGORY_LABEL[j.category] ?? j.category}</span>
                <Badge variant="secondary" className="gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {j.saved_count}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {failed.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Fehler</p>
            {failed.slice(0, 3).map((j) => (
              <div key={`${j.city}-${j.category}-err`} className="text-xs text-destructive">
                {j.city} · {CATEGORY_LABEL[j.category] ?? j.category}: {j.last_error}
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Der Import läuft automatisch im Hintergrund weiter und wird stündlich kontrolliert.
        </p>
      </CardContent>
    </Card>
  );
}
