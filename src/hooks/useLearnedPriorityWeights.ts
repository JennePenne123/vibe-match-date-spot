import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { STALE_TIMES } from '@/config/queryConfig';

export interface LearnedPriorityData {
  /** Raw learned feature weights (cuisine, vibe, price, distance, ...) */
  featureWeights: Record<string, number>;
  /** How many rated dates the learning is based on */
  totalRatings: number;
  /** 0..1 — how much we trust the learned weights */
  confidence: number;
}

/** Enough feedback for the learned weights to beat the category preset. */
export const LEARNED_WEIGHTS_MIN_RATINGS = 3;

/**
 * Reads the AI's learned feature weights so the "KI entscheidet" option can
 * start from what the user actually liked instead of a generic preset.
 */
export function useLearnedPriorityWeights() {
  const { user } = useAuth();

  return useQuery<LearnedPriorityData | null>({
    queryKey: ['learned-priority-weights', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_preference_vectors')
        .select('feature_weights, total_ratings')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const featureWeights = (data.feature_weights ?? {}) as Record<string, number>;
      const totalRatings = Number(data.total_ratings ?? 0);
      // Ramps up to full trust at ~10 rated dates.
      const confidence = Math.max(0, Math.min(1, totalRatings / 10));

      return { featureWeights, totalRatings, confidence };
    },
    enabled: !!user,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}
