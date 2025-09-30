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
    const { senderName, recipientName, venue, compatibilityScore, proposedDate } = await req.json();

    console.log('💬 GEN-INVITATION: Creating message for:', recipientName);

    if (!senderName || !recipientName || !venue) {
      return new Response(
        JSON.stringify({ error: 'Required fields missing' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are a dating invitation message writer. Create warm, personalized invitation messages that:
- Are friendly and genuine (not overly formal or cheesy)
- Reference the specific venue chosen
- Show thoughtfulness in the selection
- Are concise (2-3 sentences max)
- Feel natural and conversational

Return ONLY the message text, no JSON, no quotes, no formatting.`;

    const compatibilityInfo = compatibilityScore 
      ? `\nCompatibility Score: ${Math.round(compatibilityScore * 100)}%` 
      : '';

    const dateInfo = proposedDate 
      ? `\nProposed Date: ${new Date(proposedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}` 
      : '';

    const userPrompt = `Write a date invitation message from ${senderName} to ${recipientName}.

Venue: ${venue.name}
Cuisine: ${venue.cuisine_type || 'Various'}
Vibe: ${venue.tags?.join(', ') || 'Casual'}${compatibilityInfo}${dateInfo}

Create a warm, natural invitation message.`;

    console.log('🤖 GEN-INVITATION: Calling AI...');

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
      console.error('❌ GEN-INVITATION: AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResult = await response.json();
    const message = aiResult.choices?.[0]?.message?.content?.trim();

    if (!message) {
      throw new Error('No message generated');
    }

    console.log('✅ GEN-INVITATION: Message created');

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ GEN-INVITATION: Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
