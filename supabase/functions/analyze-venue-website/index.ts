import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimitWithLogging, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Analyze Venue Website Edge Function
 * 
 * Fetches a venue's website, analyzes similar successful venues,
 * and uses AI to suggest optimal tags/keywords.
 * 
 * Works for:
 * - Partner venues (with website from partner_profiles or venues table)
 * - Non-partner venues (uses website field from venues table)
 */

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = await checkRateLimitWithLogging(identifier, 'analyze-venue-website', RATE_LIMITS.AI_FUNCTION, req);
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(corsHeaders);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { venue_id } = await req.json();
    if (!venue_id) {
      return new Response(JSON.stringify({ error: 'venue_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check authorization: partner for this venue OR admin
    const isAdmin = await checkIsAdmin(supabase, user.id);
    if (!isAdmin) {
      const { data: partnership } = await supabase
        .from('venue_partnerships')
        .select('id')
        .eq('partner_id', user.id)
        .eq('venue_id', venue_id)
        .eq('status', 'approved')
        .maybeSingle();

      if (!partnership) {
        return new Response(JSON.stringify({ error: 'Not authorized for this venue' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Get venue data
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('id, name, tags, cuisine_type, price_range, description, website, address, menu_highlights, rating')
      .eq('id', venue_id)
      .single();

    if (venueError || !venue) {
      return new Response(JSON.stringify({ error: 'Venue not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const existingTags = new Set((venue.tags || []).map((t: string) => t.toLowerCase()));

    // Step 1: Try to fetch website content
    let websiteContent = '';
    const websiteUrl = venue.website;
    
    if (websiteUrl) {
      try {
        console.log(`🌐 Fetching website: ${websiteUrl}`);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        
        const webResponse = await fetch(websiteUrl, {
          headers: { 'User-Agent': 'VybePulse-Bot/1.0 (tag-analysis)' },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        
        if (webResponse.ok) {
          const html = await webResponse.text();
          // Extract text content, strip HTML tags, limit size
          websiteContent = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 5000); // Limit to ~5000 chars for AI context
          console.log(`✅ Website content fetched: ${websiteContent.length} chars`);
        }
      } catch (e) {
        console.warn(`⚠️ Could not fetch website: ${e.message}`);
      }
    }

    // Step 2: Find similar successful venues for tag inspiration
    const { data: similarVenues } = await supabase
      .from('venues')
      .select('name, tags, cuisine_type, price_range, rating')
      .eq('is_active', true)
      .neq('id', venue_id)
      .not('tags', 'is', null)
      .order('rating', { ascending: false })
      .limit(20);

    // Filter to venues with similar cuisine or price range
    const relevantVenues = (similarVenues || []).filter(v => {
      const sameCuisine = v.cuisine_type && venue.cuisine_type && 
        v.cuisine_type.toLowerCase() === venue.cuisine_type.toLowerCase();
      const samePrice = v.price_range && venue.price_range && 
        v.price_range === venue.price_range;
      return sameCuisine || samePrice;
    }).slice(0, 10);

    // Collect popular tags from similar venues
    const tagFrequency = new Map<string, number>();
    for (const v of relevantVenues) {
      for (const tag of (v.tags || [])) {
        const t = tag.toLowerCase();
        if (!existingTags.has(t)) {
          tagFrequency.set(t, (tagFrequency.get(t) || 0) + 1);
        }
      }
    }

    const popularSimilarTags = [...tagFrequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag, count]) => ({ tag, count }));

    // Step 3: Use AI to analyze and suggest optimal tags
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Du bist ein Experte für Restaurant- und Venue-Optimierung in Deutschland. 
Analysiere die verfügbaren Informationen über ein Venue und schlage die optimalen Tags vor, 
die das KI-Matching mit Nutzerpräferenzen maximieren.

Wichtige Tag-Kategorien:
- Küche: z.B. "schnitzel", "hausmannskost", "craft-cocktails", "vegane-optionen", "brunch"
- Atmosphäre: z.B. "romantisch", "gemütlich", "hip", "familienfreundlich", "elegant"
- Features: z.B. "terrasse", "live-musik", "craft-bier", "date-night", "after-work"
- Besonderheiten: z.B. "glutenfrei", "hundefreundlich", "barrierefrei", "reservierung-empfohlen"

Regeln:
- Schlage nur Tags vor, die NICHT bereits gesetzt sind
- Maximal 8 Vorschläge
- Tags auf Deutsch, lowercase mit Bindestrichen
- Jeder Vorschlag braucht eine konkrete Begründung
- Confidence 0-1 basierend auf Evidenz-Stärke
- Korrigiere auch falsche Kategorisierungen (z.B. wenn ein Schnitzel-Restaurant als "Burger" getagged ist)

Antworte NUR mit einem JSON-Array (kein Markdown):
[
  {
    "tag": "string",
    "confidence": number,
    "reason": "string (1-2 Sätze, deutsch)",
    "source": "website" | "similar_venues" | "ai_analysis"
  }
]`;

    const userPrompt = `Analysiere dieses Venue:
Name: ${venue.name}
Aktuelle Küche: ${venue.cuisine_type || 'Nicht angegeben'}
Preisklasse: ${venue.price_range || 'Nicht angegeben'}
Beschreibung: ${venue.description || 'Keine'}
Adresse: ${venue.address || 'Unbekannt'}
Aktuelle Tags: ${venue.tags?.join(', ') || 'Keine'}
Menü-Highlights: ${venue.menu_highlights?.join(', ') || 'Keine'}
Rating: ${venue.rating || 'Kein Rating'}

${websiteContent ? `--- WEBSITE-INHALT ---\n${websiteContent}\n--- ENDE WEBSITE ---` : 'Keine Website verfügbar.'}

${popularSimilarTags.length > 0 ? `--- BELIEBTE TAGS BEI ÄHNLICHEN VENUES ---\n${popularSimilarTags.map(t => `${t.tag} (${t.count}x verwendet)`).join('\n')}\n--- ENDE ---` : 'Keine ähnlichen Venues gefunden.'}

Schlage die besten Tags vor, die das Venue aktuell NICHT hat aber haben sollte.`;

    console.log('🤖 Calling AI for tag analysis...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit erreicht, bitte später versuchen.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI-Credits aufgebraucht.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('AI error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    let suggestions;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      suggestions = JSON.parse(cleanContent);
    } catch {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse AI tag suggestions');
    }

    // Filter out any tags that already exist (safety check)
    const filteredSuggestions = suggestions
      .filter((s: any) => !existingTags.has(s.tag?.toLowerCase()))
      .slice(0, 8);

    console.log(`✅ Generated ${filteredSuggestions.length} tag suggestions for ${venue.name}`);

    return new Response(JSON.stringify({
      suggestions: filteredSuggestions,
      websiteAnalyzed: !!websiteContent,
      similarVenuesAnalyzed: relevantVenues.length,
      venue_name: venue.name,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('analyze-venue-website error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function checkIsAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();
  return !!data;
}
