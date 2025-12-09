import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId } = await req.json();

    if (!userId) {
      throw new Error('userId is required');
    }

    console.log('🔍 Getting AI insights for user:', userId);

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

    // Calculate insights
    const totalDates = learningData?.length || 0;
    const successfulDates = learningData?.filter(d => d.actual_rating && d.actual_rating >= 4).length || 0;
    const avgRating = totalDates > 0 
      ? learningData.reduce((sum, d) => sum + (d.actual_rating || 0), 0) / totalDates 
      : 0;

    // Analyze success patterns
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

    // Generate natural language insights
    const insights: string[] = [];

    if (totalDates === 0) {
      insights.push("Complete more dates to help the AI learn your preferences!");
    } else {
      if (avgRating >= 4) {
        insights.push(`Great taste! Your average date rating is ${avgRating.toFixed(1)} stars.`);
      }

      const topSuccessPattern = Object.entries(successPatterns)
        .sort(([, a], [, b]) => b - a)[0];
      if (topSuccessPattern) {
        insights.push(`You tend to enjoy dates with ${topSuccessPattern[0].replace('_', ' ')}.`);
      }

      if (vectorData?.feature_weights) {
        const weights = vectorData.feature_weights as Record<string, number>;
        const topWeight = Object.entries(weights)
          .filter(([key]) => key !== 'distance')
          .sort(([, a], [, b]) => b - a)[0];
        if (topWeight && topWeight[1] > 1.1) {
          insights.push(`AI has learned that ${topWeight[0]} matters most to you.`);
        }
      }

      const accuracy = vectorData?.ai_accuracy || 0;
      if (accuracy > 70) {
        insights.push(`AI prediction accuracy: ${accuracy.toFixed(0)}% - recommendations are well-tuned!`);
      } else if (totalDates >= 3) {
        insights.push(`Rate more dates to improve AI accuracy (currently ${accuracy.toFixed(0)}%).`);
      }
    }

    // Calculate learning progress
    const learningProgress = Math.min(100, totalDates * 10);
    const confidenceLevel = totalDates >= 10 ? 'high' : totalDates >= 5 ? 'medium' : 'low';

    console.log('✅ Insights generated:', { totalDates, avgRating, insights: insights.length });

    return new Response(JSON.stringify({
      success: true,
      insights: {
        totalDates,
        successfulDates,
        avgRating: avgRating.toFixed(1),
        aiAccuracy: (vectorData?.ai_accuracy || 0).toFixed(1),
        learningProgress,
        confidenceLevel,
        textInsights: insights,
        featureWeights: vectorData?.feature_weights || null,
        topSuccessPatterns: Object.entries(successPatterns)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([pattern, count]) => ({ pattern, count })),
        topFailurePatterns: Object.entries(failurePatterns)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([pattern, count]) => ({ pattern, count }))
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
