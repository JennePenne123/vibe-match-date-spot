import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user preferences for context
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('preferred_cuisines, preferred_vibes, preferred_price_range, preferred_times, dietary_restrictions, preferred_activities, relationship_goal')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .maybeSingle();

    const prefsContext = prefs ? `
User preferences:
- Name: ${profile?.name || 'User'}
- Favorite cuisines: ${(prefs.preferred_cuisines || []).join(', ') || 'not set'}
- Preferred vibes: ${(prefs.preferred_vibes || []).join(', ') || 'not set'}
- Price range: ${(prefs.preferred_price_range || []).join(', ') || 'not set'}
- Preferred times: ${(prefs.preferred_times || []).join(', ') || 'not set'}
- Dietary restrictions: ${(prefs.dietary_restrictions || []).join(', ') || 'none'}
- Activities: ${(prefs.preferred_activities || []).join(', ') || 'not set'}
- Relationship goal: ${prefs.relationship_goal || 'not set'}` : '';

    const systemPrompt = `Du bist ein freundlicher, stylischer Date-Concierge für eine Date-Planning App. Du hilfst Nutzern mit:
- Kreative Date-Ideen und Inspiration
- Restaurant- und Venue-Empfehlungen basierend auf ihren Vorlieben
- Tipps für ein gelungenes Date
- Hilfe bei der App-Nutzung

Sei warm, witzig und persönlich. Nutze gelegentlich Emojis, aber übertreibe nicht. Antworte auf Deutsch, außer der Nutzer schreibt auf Englisch. Halte Antworten kurz und knackig (max 3-4 Sätze), außer der Nutzer bittet um mehr Detail.

${prefsContext}

Wenn du keine konkreten Venue-Daten hast, gib allgemeine aber hilfreiche Tipps. Verweise auf die "Plan Date" Funktion der App wenn es passt.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.slice(-20), // Last 20 messages for context
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Zu viele Anfragen – bitte kurz warten.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI-Credits aufgebraucht.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const t = await response.text();
      console.error('AI gateway error:', response.status, t);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (e) {
    console.error('ai-concierge error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
