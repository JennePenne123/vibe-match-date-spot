import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userPreferences, partnerPreferences, compatibilityScore, venues } = await req.json();

    console.log('💡 SUGGEST-IDEAS: Generating date suggestions');

    if (!userPreferences) {
      return new Response(
        JSON.stringify({ error: 'User preferences required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a creative date planning assistant. Generate 3-5 unique date ideas based on user preferences and available venues.

Each suggestion should:
- Be creative and thoughtful
- Match the users' shared interests
- Include specific venue or activity recommendations
- Consider the compatibility score
- Feel personal and exciting

Return ONLY a JSON array (no markdown):
[
  {
    "title": "Creative Date Title",
    "description": "2-3 sentence description",
    "venue_suggestion": "Specific venue or type",
    "best_time": "Lunch/Dinner/Evening",
    "why_itworks": "Brief explanation"
  }
]`;

    const preferencesText = partnerPreferences 
      ? `Shared interests:\n- Cuisines: ${[...new Set([...(userPreferences.preferred_cuisines || []), ...(partnerPreferences.preferred_cuisines || [])])].join(', ')}\n- Vibes: ${[...new Set([...(userPreferences.preferred_vibes || []), ...(partnerPreferences.preferred_vibes || [])])].join(', ')}`
      : `Preferences:\n- Cuisines: ${(userPreferences.preferred_cuisines || []).join(', ')}\n- Vibes: ${(userPreferences.preferred_vibes || []).join(', ')}`;

    const venueInfo = venues?.length 
      ? `\n\nAvailable venues:\n${venues.slice(0, 5).map((v: any) => `- ${v.name} (${v.cuisine_type})`).join('\n')}`
      : '';

    const compatibilityInfo = compatibilityScore 
      ? `\n\nCompatibility: ${Math.round(compatibilityScore * 100)}%`
      : '';

    const userPrompt = `Generate creative date ideas based on:

${preferencesText}${compatibilityInfo}${venueInfo}

Provide 3-5 unique date suggestions as JSON.`;

    console.log('🤖 SUGGEST-IDEAS: Calling AI...');

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
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ SUGGEST-IDEAS: AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    let suggestions;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      suggestions = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('❌ SUGGEST-IDEAS: Failed to parse:', content);
      throw new Error('Failed to parse AI response');
    }

    console.log('✅ SUGGEST-IDEAS: Generated', suggestions.length, 'suggestions');

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ SUGGEST-IDEAS: Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
