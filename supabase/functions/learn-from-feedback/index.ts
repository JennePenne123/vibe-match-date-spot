import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimitWithLogging, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Calculates adaptive learning rate based on rating count.
 * Early ratings have MORE impact (exploration), later ratings less (exploitation).
 */
function getLearningRate(totalRatings: number): number {
  if (totalRatings <= 2) return 0.35;   // First 2 ratings: very aggressive learning
  if (totalRatings <= 5) return 0.25;   // Next 3: aggressive learning
  if (totalRatings <= 10) return 0.15;  // Building confidence
  if (totalRatings <= 20) return 0.10;  // Settling phase
  return 0.05;                           // Stable: fine-tuning only
}

/**
 * Returns a strength multiplier based on how extreme the rating is.
 * 5-star or 1-star ratings carry more weight than 3-star.
 */
function getRatingIntensity(rating: number): number {
  switch (rating) {
    case 5: return 1.4;  // Strong positive signal
    case 4: return 1.0;  // Standard positive
    case 3: return 0.0;  // Neutral → no learning
    case 2: return 1.0;  // Standard negative
    case 1: return 1.4;  // Strong negative signal
    default: return 0.5;
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
      wouldRecommend, contextData
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
        context_data: contextData || {}
      })
      .select()
      .single();

    if (learningError) {
      console.error('Error storing learning data:', learningError);
      throw learningError;
    }

    // --- ADAPTIVE WEIGHT UPDATE ---
    const { data: existingVector } = await supabase
      .from('user_preference_vectors')
      .select('*')
      .eq('user_id', userId)
      .single();

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
      // Strong negative + wouldn't recommend: extra penalty
      if (wouldRecommend === false && actualRating <= 2) {
        const penalty = lr * 0.3;
        if (hadCuisineMatch) newWeights.cuisine = Math.max(0.3, newWeights.cuisine - penalty);
        if (hadVibeMatch) newWeights.vibe = Math.max(0.3, newWeights.vibe - penalty);
      }
    }

    // Log weight changes
    const weightChanges: Record<string, string> = {};
    for (const key of Object.keys(newWeights)) {
      const old = (oldWeights[key] || 1.0);
      const diff = newWeights[key] - old;
      if (Math.abs(diff) > 0.001) {
        weightChanges[key] = `${old.toFixed(2)} → ${newWeights[key].toFixed(2)} (${diff > 0 ? '+' : ''}${diff.toFixed(2)})`;
      }
    }
    console.log('⚖️ Weight changes:', weightChanges);

    // Upsert preference vectors
    const { error: vectorError } = await supabase
      .from('user_preference_vectors')
      .upsert({
        user_id: userId,
        total_ratings: totalRatings,
        successful_predictions: successfulPredictions,
        ai_accuracy: aiAccuracy,
        feature_weights: newWeights,
        last_updated: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (vectorError) {
      console.error('Error updating preference vectors:', vectorError);
    }

    // Calculate improvement stats
    const improvementPercent = Math.min(15, totalRatings * 1.5);

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
      newWeights
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
