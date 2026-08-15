import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { STALE_TIMES } from '@/config/queryConfig';
import { MapPin, Info, Image as ImageIcon, BadgeCheck } from 'lucide-react';

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

/**
 * Launch-readiness widget: venue density per main category and district,
 * measured against the minimum coverage we defined as "launch-fähig".
 */
const VenueDensityWidget: React.FC = () => {
  const [city, setCity] = useState('Hamburg');
  const [query, setQuery] = useState('Hamburg');

  const { data, isLoading, error } = useQuery({
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
