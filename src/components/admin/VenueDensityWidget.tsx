import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { STALE_TIMES } from '@/config/queryConfig';
import { MapPin, Info, Image as ImageIcon, BadgeCheck, Wand2, Loader2, History, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';

type BackfillCat = 'culture' | 'activity' | 'nightlife';

interface ImportRun {
  city: string;
  startedAt: string;
  finishedAt: string;
  saved: number;
  passes: number;
  status: 'completed' | 'partial' | 'failed';
  categories: BackfillCat[];
  error?: string;
}

interface ResumeState {
  city: string;
  latitude: number;
  longitude: number;
  chunkOffset: number;
  categories: BackfillCat[];
  savedSoFar: number;
  updatedAt: string;
}

const HISTORY_KEY = 'hioutz-venue-backfill-history';
const RESUME_KEY = 'hioutz-venue-backfill-resume';
const MAX_PASSES = 12;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — history is non-critical */
  }
}

interface DensityMetrics {
  city: string;
  total: number;
  with_photo: number;
  verified: number;
  targets: Record<string, number>;
  categories: { category: string; total: number; with_photo: number; verified: number }[];
  districts: {
    plz: string; total: number; essen: number; kultur: number;
    aktivitaet: number; nightlife: number; with_photo: number;
  }[];
}

const CAT_LABELS: Record<string, string> = {
  essen: 'Essen & Trinken',
  kultur: 'Kultur & Entertainment',
  aktivitaet: 'Aktivitäten',
  nightlife: 'Nightlife',
  sonstige: 'Sonstige',
};

const MAIN_CATS = ['essen', 'kultur', 'aktivitaet', 'nightlife'] as const;

// Map our density categories to the backfill-activities categories.
const BACKFILL_CAT: Record<string, 'culture' | 'activity' | 'nightlife' | null> = {
  essen: null,
  kultur: 'culture',
  aktivitaet: 'activity',
  nightlife: 'nightlife',
};

/**
 * Launch-readiness widget: venue density per main category and district,
 * measured against the minimum coverage we defined as "launch-fähig".
 */
const VenueDensityWidget: React.FC = () => {
  const [city, setCity] = useState('Hamburg');
  const [query, setQuery] = useState('Hamburg');
  const [filling, setFilling] = useState(false);
  const [progress, setProgress] = useState<{ pass: number; saved: number; categories: BackfillCat[] } | null>(null);
  const [history, setHistory] = useState<ImportRun[]>(() => readJSON<ImportRun[]>(HISTORY_KEY, []));
  const [resume, setResume] = useState<ResumeState | null>(() => readJSON<ResumeState | null>(RESUME_KEY, null));
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-venue-density', query],
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        'get_venue_density_metrics' as never,
        { _city: query } as never,
      );
      if (error) throw error;
      return data as unknown as DensityMetrics;
    },
    staleTime: STALE_TIMES.ADMIN_ANALYTICS,
  });

  const catMap = new Map((data?.categories || []).map(c => [c.category, c]));

  const weakCategories = MAIN_CATS.filter((cat) => {
    const backfillCat = BACKFILL_CAT[cat];
    if (!backfillCat) return false;
    const total = catMap.get(cat)?.total ?? 0;
    const cityTarget = (data?.targets?.[cat] ?? 8) * 5;
    return total < cityTarget;
  });

  const pushRun = (run: ImportRun) => {
    setHistory((prev) => {
      const next = [run, ...prev].slice(0, 5);
      writeJSON(HISTORY_KEY, next);
      return next;
    });
  };

  const persistResume = (state: ResumeState | null) => {
    setResume(state);
    if (state) writeJSON(RESUME_KEY, state);
    else localStorage.removeItem(RESUME_KEY);
  };

  const runImport = async (opts?: { fromResume: boolean }) => {
    const fromResume = opts?.fromResume === true;
    if (!fromResume && weakCategories.length === 0) return;
    const startedAt = new Date().toISOString();
    setFilling(true);
    let categories: BackfillCat[] = [];
    let totalSaved = fromResume ? (resume?.savedSoFar ?? 0) : 0;
    let pass = 0;
    let done = false;

    try {
      let lat: number;
      let lon: number;

      if (fromResume && resume) {
        lat = resume.latitude;
        lon = resume.longitude;
        categories = resume.categories;
      } else {
        // Geocode the city so the import is centred correctly.
        const geoResp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        );
        const geo = await geoResp.json();
        lat = Number(geo?.[0]?.lat);
        lon = Number(geo?.[0]?.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          throw new Error(`Stadt "${query}" konnte nicht geokodiert werden`);
        }
        categories = weakCategories
          .map((cat) => BACKFILL_CAT[cat])
          .filter(Boolean) as BackfillCat[];
      }

      // The import runs in time-boxed passes and hands back a resume cursor,
      // so we keep calling until the backend reports "done".
      let chunkOffset = fromResume ? (resume?.chunkOffset ?? 0) : 0;
      setProgress({ pass: 0, saved: totalSaved, categories });

      for (pass = 1; pass <= MAX_PASSES; pass++) {
        setProgress({ pass, saved: totalSaved, categories });
        const { data: result, error: fnError } = await supabase.functions.invoke('backfill-activities', {
          body: { latitude: lat, longitude: lon, radius_km: 15, categories, chunk_offset: chunkOffset },
        });
        if (fnError) throw fnError;

        const res = result as {
          total_saved?: number;
          done?: boolean;
          resume?: { chunk_offset: number; categories: BackfillCat[] };
        };
        totalSaved += res?.total_saved ?? 0;
        setProgress({ pass, saved: totalSaved, categories });

        if (res?.done !== false || !res?.resume) {
          done = true;
          break;
        }
        categories = res.resume.categories;
        chunkOffset = res.resume.chunk_offset;
        persistResume({
          city: query, latitude: lat, longitude: lon,
          chunkOffset, categories, savedSoFar: totalSaved,
          updatedAt: new Date().toISOString(),
        });
      }

      if (done) persistResume(null);

      pushRun({
        city: query, startedAt, finishedAt: new Date().toISOString(),
        saved: totalSaved, passes: Math.min(pass, MAX_PASSES),
        status: done ? 'completed' : 'partial', categories,
      });

      toast({
        title: done ? 'Import abgeschlossen' : 'Import pausiert',
        description: done
          ? `${totalSaved} Venues für ${query} ergänzt.`
          : `${totalSaved} Venues ergänzt – Rest kann fortgesetzt werden.`,
      });
      await refetch();
    } catch (e) {
      pushRun({
        city: query, startedAt, finishedAt: new Date().toISOString(),
        saved: totalSaved, passes: pass, status: 'failed', categories,
        error: e instanceof Error ? e.message : String(e),
      });
      toast({
        title: 'Import fehlgeschlagen',
        description: e instanceof Error ? e.message : String(e),
        variant: 'destructive',
      });
    } finally {
      setProgress(null);
      setFilling(false);
    }
  };

  const fillGaps = () => runImport();

  return (
    <Card className="bg-card/80 backdrop-blur border-border/40">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Venue-Dichte & Launch-Reife
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Kategorie-Abdeckung gegen unsere Mindestwerte pro Stadtteil.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          className="flex gap-2"
          onSubmit={(e) => { e.preventDefault(); setQuery(city.trim() || 'Hamburg'); }}
        >
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Stadt (z. B. Hamburg)"
            className="max-w-xs"
          />
        </form>

        {isLoading && <Skeleton className="h-64 w-full" />}

        {!isLoading && (error || !data) && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Dichte-Daten konnten nicht geladen werden.
          </p>
        )}

        {!isLoading && data && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <Stat label="Aktive Venues" value={data.total} />
              <Stat label="Mit echten Fotos" value={data.with_photo} icon={ImageIcon} />
              <Stat label="Verifiziert" value={data.verified} icon={BadgeCheck} />
            </div>

            <div className="space-y-3">
              {MAIN_CATS.map((cat) => {
                const c = catMap.get(cat);
                const total = c?.total ?? 0;
                const target = data.targets?.[cat] ?? 8;
                // City-level readiness: target per district x a handful of core districts
                const cityTarget = target * 5;
                const pct = Math.min(100, Math.round((total / cityTarget) * 100));
                const tone = pct >= 100 ? 'text-emerald-500' : pct >= 50 ? 'text-amber-500' : 'text-red-500';
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{CAT_LABELS[cat]}</span>
                      <span className={`tabular-nums font-medium ${tone}`}>
                        {total} / {cityTarget}
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                );
              })}
            </div>

            <div className="overflow-x-auto">
              <p className="text-sm font-medium text-foreground mb-2">Stadtteile (PLZ)</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground text-left">
                    <th className="py-1 pr-2">PLZ</th>
                    <th className="py-1 pr-2 text-right">Essen</th>
                    <th className="py-1 pr-2 text-right">Kultur</th>
                    <th className="py-1 pr-2 text-right">Aktiv.</th>
                    <th className="py-1 pr-2 text-right">Night.</th>
                    <th className="py-1 text-right">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.districts || []).map((d) => (
                    <tr key={d.plz} className="border-t border-border/30">
                      <td className="py-1.5 pr-2 font-medium text-foreground">{d.plz}</td>
                      <CellCell value={d.essen} target={data.targets?.essen ?? 15} />
                      <CellCell value={d.kultur} target={data.targets?.kultur ?? 8} />
                      <CellCell value={d.aktivitaet} target={data.targets?.aktivitaet ?? 8} />
                      <CellCell value={d.nightlife} target={data.targets?.nightlife ?? 8} />
                      <td className="py-1.5 text-right tabular-nums text-muted-foreground">{d.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(data.districts || []).length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-8">Keine Stadtteil-Daten</p>
              )}
            </div>

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              Launch-fähig ab {data.targets?.essen ?? 15} Essen, {data.targets?.kultur ?? 8} Kultur,{' '}
              {data.targets?.aktivitaet ?? 8} Aktivität und {data.targets?.nightlife ?? 8} Nightlife pro Stadtteil.
              Rot = unter der Hälfte, Gelb = knapp darunter, Grün = erreicht.
            </p>

            <div className="space-y-2">
              <Button
                onClick={fillGaps}
                disabled={filling || weakCategories.length === 0}
                className="w-full"
              >
                {filling
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <Wand2 className="w-4 h-4 mr-2" />}
                {weakCategories.length === 0
                  ? 'Alle Kategorien launch-fähig'
                  : `Lücken füllen (${weakCategories.map((c) => CAT_LABELS[c]).join(', ')})`}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                Importiert fehlende Kultur-, Aktivitäts- und Nightlife-Venues für {query} (15 km Radius).
              </p>

              {filling && progress && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      Durchlauf {progress.pass} / {MAX_PASSES}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {progress.saved} Venues gespeichert
                    </span>
                  </div>
                  <Progress value={Math.round((progress.pass / MAX_PASSES) * 100)} className="h-1.5" />
                  <p className="text-[11px] text-muted-foreground">
                    Läuft: {progress.categories.map((c) => BACKFILL_LABELS[c]).join(', ') || '–'}
                  </p>
                </div>
              )}

              {!filling && resume && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 space-y-2">
                  <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <PlayCircle className="w-3.5 h-3.5 text-amber-500" />
                    Offener Import – {resume.city}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Cursor bei Position {resume.chunkOffset} · {resume.savedSoFar} Venues bisher ·{' '}
                    {resume.categories.map((c) => BACKFILL_LABELS[c]).join(', ')} ·{' '}
                    {new Date(resume.updatedAt).toLocaleString('de-DE')}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => runImport({ fromResume: true })}>
                      Fortsetzen
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => persistResume(null)}>
                      Verwerfen
                    </Button>
                  </div>
                </div>
              )}

              {history.length > 0 && (
                <div className="rounded-lg border border-border/40 bg-background/40 p-3 space-y-2">
                  <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-primary" />
                    Letzte Läufe
                  </p>
                  <ul className="space-y-1.5">
                    {history.map((run) => (
                      <li key={run.startedAt} className="flex items-start gap-2 text-[11px]">
                        {run.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />}
                        {run.status === 'partial' && <PlayCircle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />}
                        {run.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />}
                        <span className="text-muted-foreground">
                          <span className="text-foreground">{run.city}</span> ·{' '}
                          {new Date(run.startedAt).toLocaleString('de-DE')} · {run.saved} Venues ·{' '}
                          {run.passes} Durchläufe
                          {run.error ? ` · ${run.error}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const CellCell: React.FC<{ value: number; target: number }> = ({ value, target }) => {
  const tone = value >= target
    ? 'text-emerald-500'
    : value >= target / 2 ? 'text-amber-500' : 'text-red-500';
  return <td className={`py-1.5 pr-2 text-right tabular-nums ${tone}`}>{value}</td>;
};

const Stat: React.FC<{ label: string; value: number; icon?: React.ElementType }> = ({ label, value, icon: Icon }) => (
  <div className="rounded-lg border border-border/40 bg-background/40 p-3">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-primary flex-shrink-0" />}
      <p className="text-xl font-bold text-foreground tabular-nums">{value.toLocaleString('de-DE')}</p>
    </div>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
  </div>
);

export default VenueDensityWidget;
