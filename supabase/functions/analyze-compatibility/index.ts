import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { checkRateLimitWithLogging, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting with logging for AI functions
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = await checkRateLimitWithLogging(identifier, 'analyze-compatibility', RATE_LIMITS.AI_FUNCTION, req);
  if (!rateLimitResult.allowed) {
    console.log(`🚫 ANALYZE-COMPATIBILITY: Rate limit ${rateLimitResult.count}/${rateLimitResult.limit}`);
    return rateLimitResponse(corsHeaders);
  }

  try {
    const { user1Preferences, user2Preferences } = await req.json();

    console.log('🔍 ANALYZE-COMPATIBILITY: Received preferences for analysis');

    if (!user1Preferences || !user2Preferences) {
      return new Response(
        JSON.stringify({ error: 'Both user preferences are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Prepare the AI prompt
    const systemPrompt = `You are a dating compatibility analyzer. Analyze the compatibility between two users based on their preferences and return a structured JSON response.

Analyze these dimensions:
1. Cuisine compatibility (preferred_cuisines)
2. Vibe compatibility (preferred_vibes)
3. Price range compatibility (preferred_price_range)
4. Timing compatibility (preferred_times)
5. Dietary restrictions compatibility (dietary_restrictions)

For each dimension, provide:
- A score between 0 and 1 (0 = no compatibility, 1 = perfect compatibility)
- Consider overlaps, complementary preferences, and potential conflicts

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "overall_score": number,
  "cuisine_score": number,
  "vibe_score": number,
  "price_score": number,
  "timing_score": number,
  "activity_score": number,
  "compatibility_factors": {
    "shared_cuisines": string[],
    "shared_vibes": string[],
    "shared_price_ranges": string[],
    "shared_times": string[],
    "reasoning": string
  }
}`;

    const userPrompt = `Analyze compatibility between these two users:

User 1 Preferences:
- Cuisines: ${JSON.stringify(user1Preferences.preferred_cuisines || [])}
- Vibes: ${JSON.stringify(user1Preferences.preferred_vibes || [])}
- Price Range: ${JSON.stringify(user1Preferences.preferred_price_range || [])}
- Times: ${JSON.stringify(user1Preferences.preferred_times || [])}
- Dietary Restrictions: ${JSON.stringify(user1Preferences.dietary_restrictions || [])}

User 2 Preferences:
- Cuisines: ${JSON.stringify(user2Preferences.preferred_cuisines || [])}
- Vibes: ${JSON.stringify(user2Preferences.preferred_vibes || [])}
- Price Range: ${JSON.stringify(user2Preferences.preferred_price_range || [])}
- Times: ${JSON.stringify(user2Preferences.preferred_times || [])}
- Dietary Restrictions: ${JSON.stringify(user2Preferences.dietary_restrictions || [])}`;

    console.log('🤖 ANALYZE-COMPATIBILITY: Calling Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ANALYZE-COMPATIBILITY: AI API error:', errorText);
      throw new Error(`AI API error: ${response.status} ${errorText}`);
    }

    const aiResult = await response.json();
    console.log('✅ ANALYZE-COMPATIBILITY: AI response received');

    const content = aiResult.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response from AI
    let compatibilityData;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      compatibilityData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('❌ ANALYZE-COMPATIBILITY: Failed to parse AI response:', content);
      throw new Error('Failed to parse AI response as JSON');
    }

    console.log('📊 ANALYZE-COMPATIBILITY: Compatibility analysis complete:', {
      overall: Math.round(compatibilityData.overall_score * 100),
      cuisine: Math.round(compatibilityData.cuisine_score * 100),
      vibe: Math.round(compatibilityData.vibe_score * 100)
    });

    return new Response(
      JSON.stringify(compatibilityData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ ANALYZE-COMPATIBILITY: Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
