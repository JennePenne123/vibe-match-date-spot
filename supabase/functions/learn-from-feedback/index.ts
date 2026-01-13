import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimitWithLogging, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting with logging for database operations
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = await checkRateLimitWithLogging(identifier, 'learn-from-feedback', RATE_LIMITS.DATABASE_OP, req);
  if (!rateLimitResult.allowed) {
    console.log(`🚫 LEARN-FROM-FEEDBACK: Rate limit ${rateLimitResult.count}/${rateLimitResult.limit}`);
    return rateLimitResponse(corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 1. Extract and verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Create client with anon key for auth verification
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      userId, 
      partnerId, 
      venueId, 
      invitationId,
      predictedScore,
      predictedFactors,
      actualRating,
      venueRating,
      aiAccuracyRating,
      wouldRecommend,
      contextData
    } = await req.json();

    // 3. Validate userId matches authenticated user
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Cannot submit feedback for other users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Now safe to use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('📚 Learning from feedback:', { userId, venueId, predictedScore, actualRating });

    // Calculate prediction error (how far off was the AI)
    const normalizedActualRating = actualRating ? (actualRating / 5) * 100 : null;
    const predictionError = normalizedActualRating !== null 
      ? Math.abs(predictedScore - normalizedActualRating)
      : null;

    // Determine success/failure factors based on rating
    const isSuccess = actualRating && actualRating >= 4;
    const successFactors: string[] = [];
    const failureFactors: string[] = [];

    if (predictedFactors) {
      const factors = typeof predictedFactors === 'string' 
        ? JSON.parse(predictedFactors) 
        : predictedFactors;
      
      if (isSuccess) {
        successFactors.push(...(factors.matchingCuisines || []));
        successFactors.push(...(factors.matchingVibes || []));
        if (factors.priceMatch) successFactors.push('price_match');
      } else if (actualRating && actualRating < 3) {
        failureFactors.push(...(factors.matchingCuisines || []));
        failureFactors.push(...(factors.matchingVibes || []));
        if (!factors.priceMatch) failureFactors.push('price_mismatch');
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

    // Update user preference vectors with learning metrics
    const { data: existingVector } = await supabase
      .from('user_preference_vectors')
      .select('*')
      .eq('user_id', userId)
      .single();

    const totalRatings = (existingVector?.total_ratings || 0) + 1;
    const successfulPredictions = (existingVector?.successful_predictions || 0) + 
      (predictionError !== null && predictionError < 20 ? 1 : 0);
    const aiAccuracy = totalRatings > 0 ? (successfulPredictions / totalRatings) * 100 : 0;

    // Update feature weights based on success/failure
    let featureWeights = existingVector?.feature_weights || {
      cuisine: 1.0,
      vibe: 1.0,
      price: 1.0,
      rating: 1.0,
      distance: 1.0
    };

    // Adjust weights based on feedback
    if (isSuccess) {
      // Boost weights for factors that led to success
      if (successFactors.length > 0) {
        featureWeights.cuisine = Math.min(2.0, (featureWeights.cuisine || 1.0) * 1.05);
        featureWeights.vibe = Math.min(2.0, (featureWeights.vibe || 1.0) * 1.05);
      }
    } else if (actualRating && actualRating < 3) {
      // Reduce weights for factors that led to failure
      featureWeights.cuisine = Math.max(0.5, (featureWeights.cuisine || 1.0) * 0.95);
      featureWeights.vibe = Math.max(0.5, (featureWeights.vibe || 1.0) * 0.95);
    }

    // Upsert preference vectors
    const { error: vectorError } = await supabase
      .from('user_preference_vectors')
      .upsert({
        user_id: userId,
        total_ratings: totalRatings,
        successful_predictions: successfulPredictions,
        ai_accuracy: aiAccuracy,
        feature_weights: featureWeights,
        last_updated: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (vectorError) {
      console.error('Error updating preference vectors:', vectorError);
    }

    // Calculate improvement percentage for response
    const improvementPercent = Math.min(5, totalRatings * 0.5);

    console.log('✅ Learning complete:', { 
      totalRatings, 
      aiAccuracy: aiAccuracy.toFixed(1),
      improvementPercent 
    });

    return new Response(JSON.stringify({
      success: true,
      learningId: learningData.id,
      metrics: {
        totalRatings,
        aiAccuracy: aiAccuracy.toFixed(1),
        improvementPercent: improvementPercent.toFixed(1),
        predictionError: predictionError?.toFixed(1) || null
      }
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
