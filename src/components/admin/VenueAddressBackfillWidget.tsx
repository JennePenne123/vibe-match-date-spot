import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Result {
  processed: number;
  updated: number;
  skipped: number;
  remaining: number;
  mode: 'resolve' | 'refresh';
}

const BATCH_SIZE = 20;

const VenueAddressBackfillWidget: React.FC = () => {
  const [running, setRunning] = useState<null | 'resolve' | 'refresh' | 'all'>(null);
  const [totals, setTotals] = useState({ updated: 0, skipped: 0, remaining: 0 });

  const runBatch = async (mode: 'resolve' | 'refresh'): Promise<Result | null> => {
    const { data, error } = await supabase.functions.invoke('refresh-venue-addresses', {
      body: { limit: BATCH_SIZE, mode },
    });
    if (error) {
      toast.error('Fehler beim Aktualisieren der Adressen');
      return null;
    }
    return data as Result;
  };

  const handleRun = async (mode: 'resolve' | 'refresh') => {
    setRunning(mode);
    const res = await runBatch(mode);
    if (res) {
      setTotals((p) => ({
        updated: p.updated + res.updated,
        skipped: p.skipped + res.skipped,
        remaining: res.remaining,
      }));
      toast.success(`${res.updated} Adressen aktualisiert`);
    }
    setRunning(null);
  };

  const handleRunAll = async () => {
    setRunning('all');
    let guard = 0;
    // Phase 1: resolve venues without google_place_id
    while (guard < 60) {
      guard++;
      const res = await runBatch('resolve');
      if (!res) break;
      setTotals((p) => ({
        updated: p.updated + res.updated,
        skipped: p.skipped + res.skipped,
        remaining: res.remaining,
      }));
      if (res.processed === 0 || res.remaining === 0) break;
    }
    setRunning(null);
    toast.success('Adress-Korrektur abgeschlossen');
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-border/40">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-teal-400" />
          Venue-Adressen korrigieren
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Gleicht Venue-Adressen per Google Places ab. „Auflösen" ersetzt fehlerhafte
          Radar/OSM-Adressen (nur nächste Straße) durch die echte Google-Adresse.
          „Auffrischen" aktualisiert bereits verknüpfte Venues.
        </p>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="text-xl font-semibold text-teal-400">{totals.updated}</div>
            <div className="text-xs text-muted-foreground">Aktualisiert</div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="text-xl font-semibold text-foreground">{totals.skipped}</div>
            <div className="text-xs text-muted-foreground">Übersprungen</div>
          </div>
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="text-xl font-semibold text-amber-400">{totals.remaining}</div>
            <div className="text-xs text-muted-foreground">Offen</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => handleRun('resolve')}
            disabled={running !== null}
            variant="outline"
            className="flex-1"
          >
            {running === 'resolve' && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Batch auflösen ({BATCH_SIZE})
          </Button>
          <Button
            onClick={() => handleRun('refresh')}
            disabled={running !== null}
            variant="outline"
            className="flex-1"
          >
            {running === 'refresh' && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Auffrischen ({BATCH_SIZE})
          </Button>
          <Button onClick={handleRunAll} disabled={running !== null} className="flex-1">
            {running === 'all' && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Alle auflösen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VenueAddressBackfillWidget;