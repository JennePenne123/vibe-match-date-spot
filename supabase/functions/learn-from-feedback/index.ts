import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimitWithLogging, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Runtime-tunable batching config for staggered feedback training.
 * Override any of these via Edge Function secrets — no redeploy of logic required.
 *
 *   FEEDBACK_BATCH_COLD          (default 3)     signals needed while totalRatings ≤ COLD_MAX
 *   FEEDBACK_BATCH_WARM          (default 4)     signals needed while totalRatings ≤ WARM_MAX
 *   FEEDBACK_BATCH_MATURE        (default 5)     signals needed above WARM_MAX
 *   FEEDBACK_AGREEMENT_COLD      (default 0.60)  min share of decisive signals leaning one way
 *   FEEDBACK_AGREEMENT_WARM      (default 0.65)
 *   FEEDBACK_AGREEMENT_MATURE    (default 0.70)
 *   FEEDBACK_COLD_MAX_RATINGS    (default 10)    upper bound of "cold" phase
 *   FEEDBACK_WARM_MAX_RATINGS    (default 30)    upper bound of "warm" phase
 *   FEEDBACK_DECISIVE_RATIO      (default 0.60)  fraction of batch that must be non-neutral to flush
 */
function num(name: string, fallback: number): number {
  const raw = Deno.env.get(name);
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const FEEDBACK_CONFIG = {
  batch: {
    cold: num('FEEDBACK_BATCH_COLD', 3),
    warm: num('FEEDBACK_BATCH_WARM', 4),
    mature: num('FEEDBACK_BATCH_MATURE', 5),
  },
  agreement: {
    cold: num('FEEDBACK_AGREEMENT_COLD', 0.60),
    warm: num('FEEDBACK_AGREEMENT_WARM', 0.65),
    mature: num('FEEDBACK_AGREEMENT_MATURE', 0.70),
  },
  phase: {
    coldMax: num('FEEDBACK_COLD_MAX_RATINGS', 10),
    warmMax: num('FEEDBACK_WARM_MAX_RATINGS', 30),
  },
  decisiveRatio: num('FEEDBACK_DECISIVE_RATIO', 0.60),
};

/**
 * Calculates adaptive learning rate based on rating count.
 * Early ratings have MORE impact (exploration), later ratings less (exploitation).
 */
function getLearningRate(totalRatings: number): number {
  // Slower, deeper learning: smaller step sizes, longer exploration phase.
  // Preferences shift gradually over many ratings instead of after 1–2.
  if (totalRatings <= 3) return 0.15;   // Cold start: careful nudges
  if (totalRatings <= 8) return 0.10;   // Early phase: still exploring
  if (totalRatings <= 20) return 0.06;  // Building deeper confidence
  if (totalRatings <= 40) return 0.04;  // Settling — deep signal accumulation
  return 0.025;                          // Stable: fine-tuning only
}

/**
 * Returns a strength multiplier based on how extreme the rating is.
 * 5-star or 1-star ratings carry more weight than 3-star.
 */
function getRatingIntensity(rating: number): number {
  switch (rating) {
    case 5: return 1.2;  // Strong positive signal (softened)
    case 4: return 0.9;  // Standard positive
    case 3: return 0.0;  // Neutral → no learning
    case 2: return 0.9;  // Standard negative
    case 1: return 1.2;  // Strong negative signal (softened)
    default: return 0.4;
  }
}

/**
 * Adjusts a single weight toward a target direction.
 * Uses adaptive learning rate and clamps to [0.3, 2.5].
 */
function adjustWeight(current: number, direction: 'boost' | 'reduce' | 'neutral', learningRate: number, strength: number = 1.0): number {
  if (direction === 'neutral') return current;
  
  const delta = direction === 'boost' 
    ? learningRate * strength 
    : -learningRate * strength;
  
  return Math.max(0.3, Math.min(2.5, current + delta));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = await checkRateLimitWithLogging(identifier, 'learn-from-feedback', RATE_LIMITS.DATABASE_OP, req);
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { 
      userId, partnerId, venueId, invitationId,
      predictedScore, predictedFactors,
      actualRating, venueRating, aiAccuracyRating,
      wouldRecommend, contextData,
      isExploration  // Flag from exploration bonus system
    } = await req.json();

    if (!userId || userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📚 Learning from feedback:', { userId, venueId, predictedScore, actualRating });

    // Calculate prediction error
    const normalizedActualRating = actualRating ? (actualRating / 5) * 100 : null;
    const predictionError = normalizedActualRating !== null 
      ? Math.abs(predictedScore - normalizedActualRating) : null;

    // Determine success/failure factors
    const isSuccess = actualRating && actualRating >= 4;
    const isFailure = actualRating && actualRating <= 2;
    const successFactors: string[] = [];
    const failureFactors: string[] = [];

    // Parse which factors actually matched
    let hadCuisineMatch = false;
    let hadVibeMatch = false;
    let hadPriceMatch = false;

    if (predictedFactors) {
      const factors = typeof predictedFactors === 'string' ? JSON.parse(predictedFactors) : predictedFactors;
      hadCuisineMatch = factors.cuisine_match === true || (factors.matchingCuisines?.length > 0);
      hadVibeMatch = (factors.vibe_matches?.length > 0) || (factors.matchingVibes?.length > 0);
      hadPriceMatch = factors.price_match === true || factors.priceMatch === true;

      if (isSuccess) {
        if (hadCuisineMatch) successFactors.push('cuisine_match');
        if (hadVibeMatch) successFactors.push('vibe_match');
        if (hadPriceMatch) successFactors.push('price_match');
      } else if (isFailure) {
        if (!hadCuisineMatch) failureFactors.push('cuisine_mismatch');
        if (!hadVibeMatch) failureFactors.push('vibe_mismatch');
        if (!hadPriceMatch) failureFactors.push('price_mismatch');
      }
    }

    // Store learning data
    const { data: learningData, error: learningError } = await supabase
      .from('ai_learning_data')
      .insert({
        user_id: userId,
        partner_id: partnerId,
        venue_id: venueId,
        invitation_id: invitationId,
        predicted_score: predictedScore || 0,
        predicted_factors: predictedFactors || {},
        actual_rating: actualRating,
        venue_rating: venueRating,
        ai_accuracy_rating: aiAccuracyRating,
        would_recommend: wouldRecommend,
        prediction_error: predictionError,
        success_factors: successFactors,
        failure_factors: failureFactors,
        context_data: {
          ...(contextData || {}),
          is_exploration: isExploration || false,
          exploration_success: isExploration && actualRating >= 4 ? true : 
                              isExploration && actualRating <= 2 ? false : null,
        }
      })
      .select()
      .single();

    if (learningError) {
      console.error('Error storing learning data:', learningError);
      throw learningError;
    }

    // --- ADAPTIVE WEIGHT UPDATE WITH TEMPORAL DECAY ---
    const { data: existingVector } = await supabase
      .from('user_preference_vectors')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Fetch recent learning data for temporal decay
    const { data: recentLearning } = await supabase
      .from('ai_learning_data')
      .select('actual_rating, created_at, predicted_factors')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    const totalRatings = (existingVector?.total_ratings || 0) + 1;
    const successfulPredictions = (existingVector?.successful_predictions || 0) + 
      (predictionError !== null && predictionError < 20 ? 1 : 0);
    const aiAccuracy = totalRatings > 0 ? (successfulPredictions / totalRatings) * 100 : 0;

    const oldWeights = (existingVector?.feature_weights as Record<string, number>) || {
      cuisine: 1.0, vibe: 1.0, price: 1.0, rating: 1.0, distance: 1.0, time: 1.0
    };

    const lr = getLearningRate(totalRatings);
    const intensity = getRatingIntensity(actualRating || 3);
    console.log(`🧠 Learning rate: ${lr}, intensity: ${intensity} (totalRatings: ${totalRatings}, rating: ${actualRating})`);

    const newWeights = { ...oldWeights };

    if (intensity === 0) {
      // Neutral rating (3 stars) → no weight changes
      console.log('⚖️ Neutral rating, skipping weight adjustments');
    } else if (isSuccess) {
      // BOOST factors that matched AND led to a good date
      newWeights.cuisine = adjustWeight(oldWeights.cuisine || 1.0, hadCuisineMatch ? 'boost' : 'neutral', lr, intensity);
      newWeights.vibe = adjustWeight(oldWeights.vibe || 1.0, hadVibeMatch ? 'boost' : 'neutral', lr, intensity);
      newWeights.price = adjustWeight(oldWeights.price || 1.0, hadPriceMatch ? 'boost' : 'neutral', lr, intensity);
      // Distance learning: if venue was close and rated well, boost distance weight
      const venueDistKm = contextData?.venue_distance_km;
      if (typeof venueDistKm === 'number' && venueDistKm <= 3) {
        newWeights.distance = adjustWeight(oldWeights.distance || 1.0, 'boost', lr, intensity * 0.5);
      } else if (typeof venueDistKm === 'number' && venueDistKm > 8 && actualRating >= 4) {
        // User is happy with far venues → reduce distance weight (they don't mind traveling)
        newWeights.distance = adjustWeight(oldWeights.distance || 1.0, 'reduce', lr, intensity * 0.3);
      }
      // If highly rated, also boost general rating weight
      if (actualRating === 5) {
        newWeights.rating = adjustWeight(oldWeights.rating || 1.0, 'boost', lr, 0.8);
      }
      // wouldRecommend signal: extra boost to all matching factors
      if (wouldRecommend === true && actualRating >= 4) {
        const recBoost = lr * 0.3;
        if (hadCuisineMatch) newWeights.cuisine = Math.min(2.5, newWeights.cuisine + recBoost);
        if (hadVibeMatch) newWeights.vibe = Math.min(2.5, newWeights.vibe + recBoost);
        if (hadPriceMatch) newWeights.price = Math.min(2.5, newWeights.price + recBoost);
      }
    } else if (isFailure) {
      // REDUCE factors that matched but STILL led to a bad date (wrong signal)
      // BOOST factors that didn't match (they might be more important than we thought)
      newWeights.cuisine = adjustWeight(oldWeights.cuisine || 1.0, hadCuisineMatch ? 'reduce' : 'boost', lr, intensity);
      newWeights.vibe = adjustWeight(oldWeights.vibe || 1.0, hadVibeMatch ? 'reduce' : 'boost', lr, intensity);
      newWeights.price = adjustWeight(oldWeights.price || 1.0, hadPriceMatch ? 'reduce' : 'boost', lr, intensity);
      // Distance learning: if far venue was rated badly, boost distance weight (proximity matters more)
      const venueDistKmFail = contextData?.venue_distance_km;
      if (typeof venueDistKmFail === 'number' && venueDistKmFail > 5) {
        newWeights.distance = adjustWeight(oldWeights.distance || 1.0, 'boost', lr, intensity * 0.5);
      }
      // Strong negative + wouldn't recommend: extra penalty
      if (wouldRecommend === false && actualRating <= 2) {
        const penalty = lr * 0.3;
        if (hadCuisineMatch) newWeights.cuisine = Math.max(0.3, newWeights.cuisine - penalty);
        if (hadVibeMatch) newWeights.vibe = Math.max(0.3, newWeights.vibe - penalty);
      }
    }

    // Log weight changes
    // --- TEMPORAL DECAY: blend weights with historical trend ---
    if (recentLearning && recentLearning.length >= 3) {
      const HALF_LIFE_DAYS = 90;
      const DECAY_CONST = Math.LN2 / HALF_LIFE_DAYS;

      // Calculate decay-weighted average for each factor
      for (const key of Object.keys(newWeights)) {
        let driftSum = 0;
        let driftWeight = 0;

        for (const entry of recentLearning) {
          if (!entry.actual_rating || !entry.created_at) continue;
          const ageMs = Date.now() - new Date(entry.created_at).getTime();
          const ageDays = ageMs / (1000 * 60 * 60 * 24);
          const decay = Math.exp(-DECAY_CONST * ageDays);
          const ratingIntensity = Math.abs((entry.actual_rating || 3) - 3) / 2;
          const effectiveWeight = decay * (0.5 + ratingIntensity);

          // Check if this factor was relevant in the prediction
          const factors = entry.predicted_factors as Record<string, any> | null;
          if (factors) {
            const hadMatch = key === 'cuisine' ? factors.cuisine_match : 
                            key === 'vibe' ? (factors.vibe_matches?.length > 0) :
                            key === 'price' ? factors.price_match : false;
            if (hadMatch && entry.actual_rating >= 4) {
              driftSum += 0.1 * effectiveWeight; // Positive drift
            } else if (hadMatch && entry.actual_rating <= 2) {
              driftSum -= 0.1 * effectiveWeight; // Negative drift
            }
          }
          driftWeight += effectiveWeight;
        }

        // Apply drift with 20% influence (subtle)
        if (driftWeight > 0) {
          const avgDrift = driftSum / driftWeight;
          newWeights[key] = Math.max(0.3, Math.min(2.5, 
            newWeights[key] + avgDrift * 0.2
          ));
        }
      }
      console.log('⏳ Temporal decay applied to weights');
    }

    const weightChanges: Record<string, string> = {};

    // --- STAGGERED / BATCHED FEEDBACK TRAINING ---
    // Rather than committing every rating directly to feature_weights, we
    // accumulate proposed deltas in learning_data.pending_deltas and only
    // flush to the live weights once we have enough consistent signal.
    //
    //   • Cold start (≤10 ratings): batch of 3, min 60% signal agreement
    //   • Warm (11-30):              batch of 4, min 65% agreement
    //   • Mature (>30):              batch of 5, min 70% agreement
    //
    // This prevents the AI from over-correcting on a single outlier rating
    // while still guaranteeing steady, deeper adaptation over time.
    const learningMeta = (existingVector?.learning_data as Record<string, any>) || {};
    const pendingDeltas: Record<string, number> = { ...(learningMeta.pending_deltas || {}) };
    const pendingSignals: Array<{ rating: number; success: boolean; ts: string }> =
      Array.isArray(learningMeta.pending_signals) ? [...learningMeta.pending_signals] : [];

    // Accumulate this rating's proposed delta per feature
    for (const key of Object.keys(newWeights)) {
      const delta = newWeights[key] - (oldWeights[key] || 1.0);
      if (Math.abs(delta) > 0.001) {
        pendingDeltas[key] = (pendingDeltas[key] || 0) + delta;
      }
    }
    if (intensity > 0) {
      pendingSignals.push({
        rating: actualRating || 3,
        success: !!isSuccess,
        ts: new Date().toISOString(),
      });
    }

    // Determine batch threshold + agreement requirement based on maturity.
    // All values are runtime-tunable via FEEDBACK_* env vars (see top of file).
    let batchThreshold = FEEDBACK_CONFIG.batch.cold;
    let minAgreement = FEEDBACK_CONFIG.agreement.cold;
    if (totalRatings > FEEDBACK_CONFIG.phase.warmMax) {
      batchThreshold = FEEDBACK_CONFIG.batch.mature;
      minAgreement = FEEDBACK_CONFIG.agreement.mature;
    } else if (totalRatings > FEEDBACK_CONFIG.phase.coldMax) {
      batchThreshold = FEEDBACK_CONFIG.batch.warm;
      minAgreement = FEEDBACK_CONFIG.agreement.warm;
    }

    // Compute signal agreement (share of successes vs failures — must lean one way)
    let flushed = false;
    let committedWeights = { ...oldWeights };

    if (pendingSignals.length >= batchThreshold) {
      const successes = pendingSignals.filter(s => s.success).length;
      const failures = pendingSignals.filter(s => !s.success && s.rating <= 2).length;
      const decisive = successes + failures;
      const agreement = decisive > 0
        ? Math.max(successes, failures) / decisive
        : 0;

      if (agreement >= minAgreement && decisive >= Math.ceil(batchThreshold * FEEDBACK_CONFIG.decisiveRatio)) {
        // Flush: average the accumulated deltas and apply once
        const flushScale = 1 / pendingSignals.length;
        for (const key of Object.keys(pendingDeltas)) {
          const averaged = pendingDeltas[key] * flushScale;
          committedWeights[key] = Math.max(0.3, Math.min(2.5,
            (oldWeights[key] || 1.0) + averaged
          ));
        }
        flushed = true;
        console.log(`✅ Batch flushed: ${pendingSignals.length} signals, agreement=${(agreement * 100).toFixed(0)}%`);
      } else {
        // Not enough agreement — keep accumulating, but decay stale signals
        console.log(`⏸️ Batch inconclusive: ${pendingSignals.length} signals, agreement=${(agreement * 100).toFixed(0)}% (needed ${minAgreement * 100}%)`);
      }
    } else {
      console.log(`📥 Batching feedback: ${pendingSignals.length}/${batchThreshold} signals collected`);
    }

    const finalWeights = flushed ? committedWeights : oldWeights;

    for (const key of Object.keys(finalWeights)) {
      const old = (oldWeights[key] || 1.0);
      const diff = finalWeights[key] - old;
      if (Math.abs(diff) > 0.001) {
        weightChanges[key] = `${old.toFixed(2)} → ${finalWeights[key].toFixed(2)} (${diff > 0 ? '+' : ''}${diff.toFixed(2)})`;
      }
    }
    console.log('⚖️ Weight changes:', weightChanges, flushed ? '(committed)' : '(pending)');

    // Persist state: on flush, reset pending buffers; otherwise keep them
    const nextLearningMeta = {
      ...learningMeta,
      pending_deltas: flushed ? {} : pendingDeltas,
      pending_signals: flushed ? [] : pendingSignals,
      last_flush_at: flushed ? new Date().toISOString() : (learningMeta.last_flush_at || null),
      batch_threshold: batchThreshold,
    };

    // Upsert preference vectors
    const { error: vectorError } = await supabase
      .from('user_preference_vectors')
      .upsert({
        user_id: userId,
        total_ratings: totalRatings,
        successful_predictions: successfulPredictions,
        ai_accuracy: aiAccuracy,
        feature_weights: finalWeights,
        learning_data: nextLearningMeta,
        last_updated: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (vectorError) {
      console.error('Error updating preference vectors:', vectorError);
    }

    // Calculate improvement stats
    const improvementPercent = Math.min(15, totalRatings * 1.5);

    // --- EXPLORATION A/B TRACKING ---
    let explorationStats = null;
    if (isExploration) {
      const { data: explorationData } = await supabase
        .from('ai_learning_data')
        .select('actual_rating, context_data')
        .eq('user_id', userId);

      const explorationEntries = (explorationData || []).filter(
        d => (d.context_data as any)?.is_exploration === true && d.actual_rating !== null
      );
      const successCount = explorationEntries.filter(d => (d.actual_rating || 0) >= 4).length;
      const totalExplorations = explorationEntries.length;
      const explorationSuccessRate = totalExplorations > 0 
        ? Math.round((successCount / totalExplorations) * 100) 
        : 0;

      explorationStats = {
        totalExplorations,
        successfulExplorations: successCount,
        explorationSuccessRate,
        thisWasSuccessful: actualRating >= 4,
      };
      console.log('🔍 Exploration tracking:', explorationStats);
    }

    console.log('✅ Learning complete:', { 
      totalRatings, aiAccuracy: aiAccuracy.toFixed(1), 
      weightChanges, improvementPercent 
    });

    return new Response(JSON.stringify({
      success: true,
      learningId: learningData.id,
      metrics: {
        totalRatings,
        aiAccuracy: aiAccuracy.toFixed(1),
        improvementPercent: improvementPercent.toFixed(1),
        predictionError: predictionError?.toFixed(1) || null
      },
      weightChanges,
      newWeights: finalWeights,
      batching: {
        flushed,
        pendingSignals: flushed ? 0 : (existingVector ? ((existingVector.learning_data as any)?.pending_signals?.length || 0) + 1 : 1),
        batchThreshold,
      },
      explorationStats
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in learn-from-feedback:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
