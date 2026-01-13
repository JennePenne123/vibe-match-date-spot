import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimitWithLogging, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TimelineEntry {
  date: string;
  rating: number;
  predicted: number;
  accuracy: number;
}

interface CategoryStat {
  count: number;
  avgRating: number;
  successRate: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting with logging for database operations
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = await checkRateLimitWithLogging(identifier, 'get-ai-insights', RATE_LIMITS.DATABASE_OP, req);
  if (!rateLimitResult.allowed) {
    console.log(`🚫 GET-AI-INSIGHTS: Rate limit ${rateLimitResult.count}/${rateLimitResult.limit}`);
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

    // 3. Parse request and validate userId matches authenticated user
    const { userId } = await req.json();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (userId !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Cannot access other users data' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Now safe to use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Getting advanced AI insights for user:', userId);

    // Get user's learning data
    const { data: learningData, error: learningError } = await supabase
      .from('ai_learning_data')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (learningError) {
      console.error('Error fetching learning data:', learningError);
      throw learningError;
    }

    // Get user's preference vectors
    const { data: vectorData } = await supabase
      .from('user_preference_vectors')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get user's preferences for category analysis
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Calculate basic insights
    const totalDates = learningData?.length || 0;
    const successfulDates = learningData?.filter(d => d.actual_rating && d.actual_rating >= 4).length || 0;
    const avgRating = totalDates > 0 
      ? learningData.reduce((sum, d) => sum + (d.actual_rating || 0), 0) / totalDates 
      : 0;

    // === TREND ANALYSIS ===
    const sortedByDate = [...(learningData || [])].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    const recentEntries = sortedByDate.slice(-5);
    const previousEntries = sortedByDate.slice(-10, -5);
    
    const recentAvgRating = recentEntries.length > 0
      ? recentEntries.reduce((sum, d) => sum + (d.actual_rating || 0), 0) / recentEntries.length
      : 0;
    const previousAvgRating = previousEntries.length > 0
      ? previousEntries.reduce((sum, d) => sum + (d.actual_rating || 0), 0) / previousEntries.length
      : 0;
    
    const improvementPercent = previousAvgRating > 0 
      ? ((recentAvgRating - previousAvgRating) / previousAvgRating) * 100 
      : 0;
    
    let ratingTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (improvementPercent > 5) ratingTrend = 'improving';
    else if (improvementPercent < -5) ratingTrend = 'declining';

    // Calculate accuracy trend
    const recentAccuracy = recentEntries.filter(d => d.prediction_error !== null).length > 0
      ? 100 - (recentEntries.reduce((sum, d) => sum + Math.abs(d.prediction_error || 0), 0) / recentEntries.filter(d => d.prediction_error !== null).length * 20)
      : 0;
    const previousAccuracy = previousEntries.filter(d => d.prediction_error !== null).length > 0
      ? 100 - (previousEntries.reduce((sum, d) => sum + Math.abs(d.prediction_error || 0), 0) / previousEntries.filter(d => d.prediction_error !== null).length * 20)
      : 0;
    
    let accuracyTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentAccuracy - previousAccuracy > 5) accuracyTrend = 'improving';
    else if (recentAccuracy - previousAccuracy < -5) accuracyTrend = 'declining';

    // === TIMELINE DATA FOR CHARTS ===
    const timelineData: TimelineEntry[] = sortedByDate.map(entry => {
      const accuracy = entry.prediction_error !== null 
        ? Math.max(0, 100 - Math.abs(entry.prediction_error) * 20)
        : 75;
      return {
        date: new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rating: entry.actual_rating || 0,
        predicted: entry.predicted_score || 0,
        accuracy: Math.round(accuracy)
      };
    });

    // === CATEGORY PERFORMANCE ===
    const categoryPerformance: {
      byCuisine: Record<string, CategoryStat>;
      byVibe: Record<string, CategoryStat>;
      byPrice: Record<string, CategoryStat>;
    } = {
      byCuisine: {},
      byVibe: {},
      byPrice: {}
    };

    // Analyze success/failure factors for category insights
    learningData?.forEach(entry => {
      const contextData = entry.context_data as Record<string, any> | null;
      const rating = entry.actual_rating || 0;
      const isSuccess = rating >= 4;

      // Extract cuisine from context or success factors
      if (contextData?.cuisine) {
        const cuisine = contextData.cuisine;
        if (!categoryPerformance.byCuisine[cuisine]) {
          categoryPerformance.byCuisine[cuisine] = { count: 0, avgRating: 0, successRate: 0 };
        }
        categoryPerformance.byCuisine[cuisine].count++;
        categoryPerformance.byCuisine[cuisine].avgRating += rating;
        if (isSuccess) categoryPerformance.byCuisine[cuisine].successRate++;
      }

      if (contextData?.vibe) {
        const vibe = contextData.vibe;
        if (!categoryPerformance.byVibe[vibe]) {
          categoryPerformance.byVibe[vibe] = { count: 0, avgRating: 0, successRate: 0 };
        }
        categoryPerformance.byVibe[vibe].count++;
        categoryPerformance.byVibe[vibe].avgRating += rating;
        if (isSuccess) categoryPerformance.byVibe[vibe].successRate++;
      }

      if (contextData?.priceRange) {
        const price = contextData.priceRange;
        if (!categoryPerformance.byPrice[price]) {
          categoryPerformance.byPrice[price] = { count: 0, avgRating: 0, successRate: 0 };
        }
        categoryPerformance.byPrice[price].count++;
        categoryPerformance.byPrice[price].avgRating += rating;
        if (isSuccess) categoryPerformance.byPrice[price].successRate++;
      }
    });

    // Calculate averages for categories
    Object.values(categoryPerformance.byCuisine).forEach(stat => {
      if (stat.count > 0) {
        stat.avgRating = stat.avgRating / stat.count;
        stat.successRate = (stat.successRate / stat.count) * 100;
      }
    });
    Object.values(categoryPerformance.byVibe).forEach(stat => {
      if (stat.count > 0) {
        stat.avgRating = stat.avgRating / stat.count;
        stat.successRate = (stat.successRate / stat.count) * 100;
      }
    });
    Object.values(categoryPerformance.byPrice).forEach(stat => {
      if (stat.count > 0) {
        stat.avgRating = stat.avgRating / stat.count;
        stat.successRate = (stat.successRate / stat.count) * 100;
      }
    });

    // === RADAR CHART DATA ===
    const featureWeights = vectorData?.feature_weights as Record<string, number> | null;
    const radarData = [
      { 
        category: 'Cuisine', 
        value: Math.min(100, ((featureWeights?.cuisine || 1) - 0.5) * 100), 
        fullMark: 100 
      },
      { 
        category: 'Vibe', 
        value: Math.min(100, ((featureWeights?.vibe || 1) - 0.5) * 100), 
        fullMark: 100 
      },
      { 
        category: 'Price', 
        value: Math.min(100, ((featureWeights?.price || 1) - 0.5) * 100), 
        fullMark: 100 
      },
      { 
        category: 'Rating', 
        value: Math.min(100, ((featureWeights?.rating || 1) - 0.5) * 100), 
        fullMark: 100 
      },
      { 
        category: 'Distance', 
        value: Math.min(100, ((featureWeights?.distance || 1) - 0.5) * 100), 
        fullMark: 100 
      }
    ];

    // === SUCCESS/FAILURE PATTERNS ===
    const successPatterns: Record<string, number> = {};
    const failurePatterns: Record<string, number> = {};

    learningData?.forEach(entry => {
      if (entry.success_factors) {
        (entry.success_factors as string[]).forEach(factor => {
          successPatterns[factor] = (successPatterns[factor] || 0) + 1;
        });
      }
      if (entry.failure_factors) {
        (entry.failure_factors as string[]).forEach(factor => {
          failurePatterns[factor] = (failurePatterns[factor] || 0) + 1;
        });
      }
    });

    // === PREDICTIONS ===
    const predictions: string[] = [];
    
    // Best performing cuisine
    const bestCuisine = Object.entries(categoryPerformance.byCuisine)
      .sort(([, a], [, b]) => b.avgRating - a.avgRating)[0];
    if (bestCuisine && bestCuisine[1].count >= 2) {
      predictions.push(`${bestCuisine[0]} venues: ${bestCuisine[1].successRate.toFixed(0)}% success rate`);
    }

    // Best performing vibe
    const bestVibe = Object.entries(categoryPerformance.byVibe)
      .sort(([, a], [, b]) => b.avgRating - a.avgRating)[0];
    if (bestVibe && bestVibe[1].count >= 2) {
      predictions.push(`${bestVibe[0]} atmosphere works best for you`);
    }

    // Improvement suggestion based on accuracy
    if (vectorData?.ai_accuracy && vectorData.ai_accuracy > 70) {
      predictions.push(`AI accuracy is ${vectorData.ai_accuracy.toFixed(0)}% - recommendations are well-tuned!`);
    } else if (totalDates >= 3) {
      predictions.push(`Rate ${Math.max(1, 5 - totalDates)} more dates to improve predictions`);
    }

    // Pattern-based prediction
    const topPattern = Object.entries(successPatterns).sort(([, a], [, b]) => b - a)[0];
    if (topPattern && topPattern[1] >= 2) {
      predictions.push(`"${topPattern[0].replace(/_/g, ' ')}" correlates with higher ratings`);
    }

    // === TEXT INSIGHTS ===
    const textInsights: string[] = [];

    if (totalDates === 0) {
      textInsights.push("Complete more dates to help the AI learn your preferences!");
    } else {
      if (avgRating >= 4) {
        textInsights.push(`Great taste! Your average date rating is ${avgRating.toFixed(1)} stars.`);
      }

      if (ratingTrend === 'improving' && previousAvgRating > 0) {
        textInsights.push(`Your ratings are improving! Up ${improvementPercent.toFixed(0)}% recently.`);
      }

      if (featureWeights) {
        const topWeight = Object.entries(featureWeights)
          .filter(([key]) => key !== 'distance')
          .sort(([, a], [, b]) => (b as number) - (a as number))[0];
        if (topWeight && (topWeight[1] as number) > 1.1) {
          textInsights.push(`AI learned that ${topWeight[0]} matters most to you.`);
        }
      }

      if (accuracyTrend === 'improving') {
        textInsights.push("AI predictions are getting more accurate!");
      }
    }

    // Calculate learning progress
    const learningProgress = Math.min(100, totalDates * 10);
    const confidenceLevel = totalDates >= 10 ? 'high' : totalDates >= 5 ? 'medium' : 'low';

    console.log('✅ Advanced insights generated:', { 
      totalDates, 
      avgRating: avgRating.toFixed(1), 
      timelineEntries: timelineData.length,
      predictions: predictions.length
    });

    return new Response(JSON.stringify({
      success: true,
      insights: {
        // Basic stats
        totalDates,
        successfulDates,
        avgRating: avgRating.toFixed(1),
        aiAccuracy: (vectorData?.ai_accuracy || 0).toFixed(1),
        learningProgress,
        confidenceLevel,
        textInsights,
        featureWeights: vectorData?.feature_weights || null,
        
        // Success/failure patterns
        topSuccessPatterns: Object.entries(successPatterns)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([pattern, count]) => ({ pattern, count })),
        topFailurePatterns: Object.entries(failurePatterns)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([pattern, count]) => ({ pattern, count })),
        
        // NEW: Advanced insights
        trends: {
          ratingTrend,
          accuracyTrend,
          recentAvgRating: Number(recentAvgRating.toFixed(2)),
          previousAvgRating: Number(previousAvgRating.toFixed(2)),
          improvementPercent: Number(improvementPercent.toFixed(1))
        },
        categoryPerformance,
        timelineData,
        predictions,
        radarData
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-ai-insights:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
