import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { STALE_TIMES } from '@/config/queryConfig';
import { FlaskConical } from 'lucide-react';
import { SCORING_EXPERIMENT_ID } from '@/services/experiments/scoringExperiment';

interface ExperimentRow {
  variant: string;
  users: number;
  recommendations: number;
  positive_feedback: number;
  negative_feedback: number;
  avg_rating: number | null;
  avg_ai_accuracy: number | null;
}

const VARIANT_LABEL: Record<string, string> = {
  control: 'A — alte Gewichtung',
  treatment: 'B — neue Gewichtung',
};

const ScoringExperimentWidget: React.FC = () => {
  const { data, isLoading } = useQuery<ExperimentRow[]>({
    queryKey: ['admin-scoring-experiment', SCORING_EXPERIMENT_ID],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_experiment_summary', {
        _experiment: SCORING_EXPERIMENT_ID,
      });
      if (error) throw error;
      return (data ?? []) as unknown as ExperimentRow[];
    },
    staleTime: STALE_TIMES.ADMIN,
    refetchInterval: STALE_TIMES.ADMIN,
    refetchOnWindowFocus: true,
  });

  const rows = data ?? [];

  const positiveRate = (r: ExperimentRow) => {
    const total = Number(r.positive_feedback) + Number(r.negative_feedback);
    return total > 0 ? Math.round((Number(r.positive_feedback) / total) * 100) : null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="h-4 w-4 text-primary" />
          A/B-Test: KI-Gewichtung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Messdaten. Der Test läuft ab sofort mit, sobald Nutzer Empfehlungen erhalten und bewerten.
          </p>
        ) : (
          rows.map((r) => (
            <div key={r.variant} className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">{VARIANT_LABEL[r.variant] ?? r.variant}</span>
                <Badge variant={r.variant === 'treatment' ? 'default' : 'secondary'}>
                  {Number(r.users)} Nutzer
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Empfehlungen: <span className="text-foreground">{Number(r.recommendations)}</span></div>
                <div>Ø Bewertung: <span className="text-foreground">{r.avg_rating ?? '–'}</span></div>
                <div>Ø KI-Genauigkeit: <span className="text-foreground">{r.avg_ai_accuracy ?? '–'}</span></div>
                <div>
                  Positiv-Quote:{' '}
                  <span className="text-foreground">
                    {positiveRate(r) !== null ? `${positiveRate(r)}%` : '–'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        <p className="text-xs text-muted-foreground">
          Zuweisung 50/50, deterministisch pro Nutzer. Aussagekräftig ab ca. 100 Bewertungen je Gruppe.
        </p>
      </CardContent>
    </Card>
  );
};

export default ScoringExperimentWidget;
