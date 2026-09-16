import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, RefreshCw } from 'lucide-react';
import { STALE_TIMES } from '@/config/queryConfig';

interface SourceMetric {
  source: string;
  attempts: number;
  hits: number;
  misses: number;
  errors: number;
  photos: number;
  api_calls: number;
  estimated_cost: number;
  hit_rate: number | null;
}

interface PhotoBackfillMetrics {
  window_days: number;
  by_source: SourceMetric[];
  total_attempts: number;
  total_cost: number;
  cached_venues: number;
  cooldown_active: number;
  recent_errors: Array<{ venue_id: string; source: string; message: string; attempted_at: string }>;
}

const SOURCE_LABEL: Record<string, string> = {
  google: 'Google Places',
  wikimedia: 'Wikimedia Commons',
  foursquare: 'Foursquare',
};

const PhotoBackfillMetricsWidget: React.FC = () => {
  const { t } = useTranslation();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['photo-backfill-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_photo_backfill_metrics' as never, {
        days_back: 7,
      } as never);
      if (error) throw error;
      return data as unknown as PhotoBackfillMetrics;
    },
    staleTime: STALE_TIMES.DYNAMIC,
  });

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Camera className="h-4 w-4" />
          {t('admin.photoBackfillMetrics', 'Foto-Nachtrag: Trefferquote & Kosten')}
        </CardTitle>
        <Button variant="ghost" size="icon-sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <p className="text-sm text-muted-foreground">{t('common.loading', 'Lädt…')}</p>
        )}

        {data && (
          <>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-border/60 p-2">
                <div className="text-lg font-semibold">{data.total_attempts}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t('admin.photoAttempts7d', 'Versuche (7 Tage)')}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 p-2">
                <div className="text-lg font-semibold">${Number(data.total_cost).toFixed(2)}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t('admin.photoCost7d', 'Kosten (7 Tage)')}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 p-2">
                <div className="text-lg font-semibold">{data.cooldown_active}</div>
                <div className="text-[11px] text-muted-foreground">
                  {t('admin.photoCooldown', 'gesperrt (kein Doppel-Lauf)')}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {data.by_source.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('admin.photoNoAttempts', 'Noch keine Foto-Läufe in diesem Zeitraum.')}
                </p>
              )}
              {data.by_source.map((s) => (
                <div
                  key={s.source}
                  className="rounded-xl border border-border/60 p-3 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {SOURCE_LABEL[s.source] || s.source}
                    </span>
                    <Badge variant={Number(s.hit_rate) >= 30 ? 'default' : 'secondary'}>
                      {s.hit_rate === null ? '–' : `${s.hit_rate}%`}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('admin.photoSourceLine', {
                      defaultValue:
                        '{{hits}} Treffer · {{misses}} ohne Foto · {{errors}} Fehler · {{photos}} Fotos · ${{cost}}',
                      hits: s.hits,
                      misses: s.misses,
                      errors: s.errors,
                      photos: s.photos,
                      cost: Number(s.estimated_cost).toFixed(2),
                    })}
                  </div>
                </div>
              ))}
            </div>

            {data.recent_errors.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  {t('admin.photoRecentErrors', 'Letzte Fehler')}
                </div>
                {data.recent_errors.slice(0, 5).map((e, i) => (
                  <div key={i} className="text-[11px] text-muted-foreground truncate">
                    {e.source} · {e.venue_id}: {e.message}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PhotoBackfillMetricsWidget;
