import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipTitle, tipCategory, userId } = await req.json();

    if (!tipTitle) {
      return new Response(
        JSON.stringify({ error: 'tipTitle is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user preferences if userId provided
    let userPrefs = null;
    if (userId) {
      const { data } = await supabase
        .from('user_preferences')
        .select('preferred_cuisines, preferred_vibes, preferred_price_range, preferred_activities')
        .eq('user_id', userId)
        .maybeSingle();
      userPrefs = data;
    }

    // Fetch active venues
    const { data: venues } = await supabase
      .from('venues')
      .select('id, name, address, cuisine_type, price_range, rating, tags, description, latitude, longitude')
      .eq('is_active', true)
      .limit(50);

    if (!venues || venues.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No venues available', venue: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const venueList = venues.map(v => 
      `- ${v.name} (${v.cuisine_type || 'N/A'}, ${v.price_range || 'N/A'}, Rating: ${v.rating || 'N/A'}) [ID: ${v.id}]`
    ).join('\n');

    const prefsText = userPrefs
      ? `User preferences: Cuisines: ${(userPrefs.preferred_cuisines || []).join(', ')}, Vibes: ${(userPrefs.preferred_vibes || []).join(', ')}, Budget: ${(userPrefs.preferred_price_range || []).join(', ')}`
      : 'No user preferences available.';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: `You are a local city guide AI. Pick the SINGLE best venue from the list that matches the given tip/activity suggestion. Consider user preferences if available. Return ONLY a JSON object with: {"venue_id": "...", "reason": "One sentence in German why this venue is perfect for this activity"}`
          },
          {
            role: 'user',
            content: `Tip: "${tipTitle}" (Category: ${tipCategory})\n\n${prefsText}\n\nAvailable venues:\n${venueList}\n\nPick the best matching venue. Return JSON only.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    let parsed;
    try {
      const clean = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      console.error('Failed to parse AI response:', content);
      // Fallback: pick highest rated venue
      const best = venues.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
      parsed = { venue_id: best.id, reason: 'Unser Top-Tipp für dich!' };
    }

    // Validate venue exists
    const matchedVenue = venues.find(v => v.id === parsed.venue_id);
    if (!matchedVenue) {
      const best = venues.sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
      parsed = { venue_id: best.id, reason: 'Unser Top-Tipp für dich!' };
    }

    return new Response(
      JSON.stringify({ venue_id: parsed.venue_id, reason: parsed.reason }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('ai-quick-tip error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
