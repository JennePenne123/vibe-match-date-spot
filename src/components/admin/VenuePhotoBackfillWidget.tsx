import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Image, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BackfillResult {
  processed: number;
  matched: number;
  updated: number;
  skipped: number;
  remaining: number;
}

const BATCH_SIZE = 20;

const VenuePhotoBackfillWidget: React.FC = () => {
  const { t } = useTranslation();
  const [running, setRunning] = useState(false);
  const [totals, setTotals] = useState<BackfillResult>({
    processed: 0,
    matched: 0,
    updated: 0,
    skipped: 0,
    remaining: 0,
  });

  const runBatch = async (): Promise<BackfillResult | null> => {
    const { data, error } = await supabase.functions.invoke('backfill-venue-photos', {
      body: { limit: BATCH_SIZE },
    });
    if (error) {
      toast.error(t('admin.backfillError', 'Fehler beim Nachladen der Fotos'));
      return null;
    }
    return data as BackfillResult;
  };

  const handleRunOnce = async () => {
    setRunning(true);
    const res = await runBatch();
    if (res) {
      setTotals((prev) => ({
        processed: prev.processed + res.processed,
        matched: prev.matched + res.matched,
        updated: prev.updated + res.updated,
        skipped: prev.skipped + res.skipped,
        remaining: res.remaining,
      }));
      toast.success(
        t('admin.backfillBatchDone', '{{updated}} Venues mit echten Fotos aktualisiert', {
          updated: res.updated,
        }),
      );
    }
    setRunning(false);
  };

  const handleRunAll = async () => {
    setRunning(true);
    let guard = 0;
    // Cap iterations to avoid runaway loops / excessive API cost per session.
    while (guard < 50) {
      guard++;
      const res = await runBatch();
      if (!res) break;
      setTotals((prev) => ({
        processed: prev.processed + res.processed,
        matched: prev.matched + res.matched,
        updated: prev.updated + res.updated,
        skipped: prev.skipped + res.skipped,
        remaining: res.remaining,
      }));
      if (res.processed === 0 || res.remaining === 0) break;
    }
    setRunning(false);
    toast.success(t('admin.backfillAllDone', 'Foto-Nachladen abgeschlossen'));
  };

  const totalKnown = totals.remaining + totals.matched;
  const progressPct = totalKnown > 0 ? Math.round((totals.matched / totalKnown) * 100) : 0;

  return (
    <Card className="bg-card/80 backdrop-blur border-border/40">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Image className="w-5 h-5 text-teal-400" />
          {t('admin.venuePhotoBackfill', 'Echte Venue-Fotos nachladen')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t(
            'admin.venuePhotoBackfillDesc',
            'Gleicht gecachte Venues ohne Google-Zuordnung per Name und Standort mit Google Places ab und lädt echte Fotos. Verbraucht Google-API-Kontingent.',
          )}
        </p>

        {running && (
          <div className="space-y-2">
            <Progress value={progressPct} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {t('admin.backfillRunning', 'Läuft… bitte Fenster geöffnet lassen')}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="text-xl font-semibold text-foreground">{totals.matched}</div>
            <div className="text-xs text-muted-foreground">{t('admin.backfillMatched', 'Zugeordnet')}</div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="text-xl font-semibold text-teal-400">{totals.updated}</div>
            <div className="text-xs text-muted-foreground">{t('admin.backfillUpdated', 'Mit Foto')}</div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="text-xl font-semibold text-foreground">{totals.skipped}</div>
            <div className="text-xs text-muted-foreground">{t('admin.backfillSkipped', 'Übersprungen')}</div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="text-xl font-semibold text-amber-400">{totals.remaining}</div>
            <div className="text-xs text-muted-foreground">{t('admin.backfillRemaining', 'Verbleibend')}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleRunOnce} disabled={running} variant="outline" className="flex-1">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t('admin.backfillRunBatch', 'Ein Batch ({{n}})', { n: BATCH_SIZE })}
          </Button>
          <Button onClick={handleRunAll} disabled={running} className="flex-1">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t('admin.backfillRunAll', 'Alle nachladen')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VenuePhotoBackfillWidget;
