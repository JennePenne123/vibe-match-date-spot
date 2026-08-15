/**
 * A/B-Test: KI-Gewichtung "alt" (control) vs. "neu" (treatment).
 *
 * control   = Gewichtung vor dem Update (gelernte Signale ×1.0, Intent-Boost ungedämpft)
 * treatment = neue Gewichtung (gelernte Signale ×1.9, Intent-Boost auf 70 % gedämpft)
 *
 * Zuweisung ist deterministisch pro User (Hash der User-ID) — ein User bleibt
 * dauerhaft in derselben Gruppe, damit die Messung nicht verwässert.
 */
import { supabase } from '@/integrations/supabase/client';

export const SCORING_EXPERIMENT_ID = 'scoring_weights_v2';

export type ExperimentVariant = 'control' | 'treatment';

export interface ScoringWeightsConfig {
  learnedSignalAmplifier: number;
  situationalDampening: number;
}

const VARIANT_CONFIG: Record<ExperimentVariant, ScoringWeightsConfig> = {
  control: { learnedSignalAmplifier: 1.0, situationalDampening: 1.0 },
  treatment: { learnedSignalAmplifier: 1.9, situationalDampening: 0.7 },
};

/** Stabiler 32-bit Hash (FNV-1a) */
const hashString = (value: string): number => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
};

export const getExperimentVariant = (userId?: string | null): ExperimentVariant => {
  if (!userId) return 'treatment';
  return hashString(`${SCORING_EXPERIMENT_ID}:${userId}`) % 2 === 0 ? 'control' : 'treatment';
};

export const getScoringWeights = (userId?: string | null): ScoringWeightsConfig & { variant: ExperimentVariant } => {
  const variant = getExperimentVariant(userId);
  return { variant, ...VARIANT_CONFIG[variant] };
};

interface LogEventInput {
  userId?: string | null;
  eventType: 'recommendation_shown' | 'venue_feedback' | 'date_feedback';
  venueId?: string | null;
  rating?: number | null;
  aiAccuracyRating?: number | null;
  metadata?: Record<string, unknown>;
}

/** Fire-and-forget: Experiment-Ereignis protokollieren (blockiert nie die UI). */
export const logExperimentEvent = async ({
  userId,
  eventType,
  venueId,
  rating,
  aiAccuracyRating,
  metadata = {},
}: LogEventInput): Promise<void> => {
  try {
    let uid = userId ?? null;
    if (!uid) {
      const { data } = await supabase.auth.getUser();
      uid = data.user?.id ?? null;
    }
    if (!uid) return;

    await supabase.from('ai_experiment_events').insert({
      user_id: uid,
      experiment: SCORING_EXPERIMENT_ID,
      variant: getExperimentVariant(uid),
      event_type: eventType,
      venue_id: venueId ?? null,
      rating: rating ?? null,
      ai_accuracy_rating: aiAccuracyRating ?? null,
      metadata: metadata as never,
    });
  } catch (error) {
    console.warn('[Experiment] Event konnte nicht protokolliert werden', error);
  }
};
