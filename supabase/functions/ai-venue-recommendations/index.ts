import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
  const rateLimitResult = await checkRateLimitWithLogging(identifier, 'ai-venue-recommendations', RATE_LIMITS.AI_FUNCTION, req);
  if (!rateLimitResult.allowed) {
    console.log(`🚫 AI-VENUE-RECS: Rate limit ${rateLimitResult.count}/${rateLimitResult.limit}`);
    return rateLimitResponse(corsHeaders);
  }

  try {
    const { venue, userPreferences, partnerPreferences } = await req.json();

    console.log('🏢 AI-VENUE-RECS: Analyzing venue:', venue.name);

    if (!venue || !userPreferences) {
      return new Response(
        JSON.stringify({ error: 'Venue and user preferences are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a venue recommendation expert. Analyze how well a venue matches user preferences and provide a detailed score and reasoning.

Consider:
- Cuisine match with preferred cuisines
- Vibe/ambiance match with preferred vibes
- Price range compatibility
- Overall suitability for a date

Return ONLY a JSON object (no markdown, no explanation):
{
  "ai_score": number (0-100),
  "match_factors": {
    "cuisine_match": boolean,
    "vibe_match": boolean,
    "price_match": boolean,
    "rating_bonus": number
  },
  "ai_reasoning": string (2-3 sentences explaining why this venue is a good match),
  "confidence_level": number (0-1)
}`;

    const preferencesText = partnerPreferences 
      ? `User 1: ${JSON.stringify(userPreferences)}\nUser 2: ${JSON.stringify(partnerPreferences)}`
      : JSON.stringify(userPreferences);

    const userPrompt = `Analyze this venue:
Name: ${venue.name}
Cuisine: ${venue.cuisine_type || 'Not specified'}
Price: ${venue.price_range || 'Not specified'}
Rating: ${venue.rating || 'Not rated'}
Description: ${venue.description || 'No description'}
Tags: ${venue.tags?.join(', ') || 'None'}

Against these preferences:
${preferencesText}

Provide your analysis as JSON.`;

    console.log('🤖 AI-VENUE-RECS: Calling AI...');

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
      console.error('❌ AI-VENUE-RECS: AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    let venueAnalysis;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      venueAnalysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('❌ AI-VENUE-RECS: Failed to parse:', content);
      throw new Error('Failed to parse AI response');
    }

    console.log('✅ AI-VENUE-RECS: Analysis complete:', {
      venue: venue.name,
      score: venueAnalysis.ai_score
    });

    return new Response(
      JSON.stringify(venueAnalysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ AI-VENUE-RECS: Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
