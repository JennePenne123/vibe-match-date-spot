import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Automatic Tag Learning Edge Function
 * 
 * Analyzes user feedback patterns to suggest new tags for venues.
 * Logic:
 * 1. Look at users who rated a venue highly (4-5 stars)
 * 2. Check what vibes/cuisines/preferences those users had
 * 3. If a pattern emerges (e.g., 3+ "romantic" users rated highly), suggest that tag
 * 4. Return suggestions for the partner to approve/dismiss
 */

interface TagSuggestion {
  tag: string;
  confidence: number; // 0-1
  reason: string;
  sourceCount: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { venue_id } = await req.json();
    if (!venue_id) {
      return new Response(JSON.stringify({ error: "venue_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify partner owns this venue
    const { data: partnership } = await supabase
      .from("venue_partnerships")
      .select("id")
      .eq("partner_id", user.id)
      .eq("venue_id", venue_id)
      .eq("status", "approved")
      .maybeSingle();

    if (!partnership) {
      return new Response(JSON.stringify({ error: "Not authorized for this venue" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get venue's current tags
    const { data: venue } = await supabase
      .from("venues")
      .select("tags, cuisine_type, price_range")
      .eq("id", venue_id)
      .single();

    const existingTags = new Set((venue?.tags || []).map((t: string) => t.toLowerCase()));

    // Get all positive feedback (rating >= 4) for this venue
    const { data: invitations } = await supabase
      .from("date_invitations")
      .select("id, sender_id, recipient_id")
      .eq("venue_id", venue_id)
      .eq("date_status", "completed");

    if (!invitations || invitations.length === 0) {
      return new Response(JSON.stringify({ suggestions: [], message: "Noch keine abgeschlossenen Dates für Analyse." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const invitationIds = invitations.map(i => i.id);
    const userIds = new Set<string>();
    invitations.forEach(i => {
      userIds.add(i.sender_id);
      userIds.add(i.recipient_id);
    });

    // Get positive feedback
    const { data: feedback } = await supabase
      .from("date_feedback")
      .select("user_id, rating, venue_rating")
      .in("invitation_id", invitationIds)
      .gte("rating", 4);

    if (!feedback || feedback.length === 0) {
      return new Response(JSON.stringify({ suggestions: [], message: "Noch nicht genug positive Bewertungen." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const happyUserIds = feedback.map(f => f.user_id);

    // Get preferences of happy users
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("preferred_vibes, preferred_cuisines, preferred_activities, preferred_venue_types, preferred_times")
      .in("user_id", happyUserIds);

    if (!preferences || preferences.length === 0) {
      return new Response(JSON.stringify({ suggestions: [], message: "Keine Nutzerpräferenzen verfügbar." }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Count vibe/preference occurrences among happy users
    const vibeCounts = new Map<string, number>();
    const activityCounts = new Map<string, number>();
    const timeCounts = new Map<string, number>();
    const totalUsers = preferences.length;

    for (const pref of preferences) {
      if (pref.preferred_vibes) {
        for (const vibe of pref.preferred_vibes) {
          vibeCounts.set(vibe.toLowerCase(), (vibeCounts.get(vibe.toLowerCase()) || 0) + 1);
        }
      }
      if (pref.preferred_activities) {
        for (const act of pref.preferred_activities) {
          activityCounts.set(act.toLowerCase(), (activityCounts.get(act.toLowerCase()) || 0) + 1);
        }
      }
      if (pref.preferred_times) {
        for (const time of pref.preferred_times) {
          timeCounts.set(time.toLowerCase(), (timeCounts.get(time.toLowerCase()) || 0) + 1);
        }
      }
    }

    // Generate suggestions where ≥40% of happy users share a preference
    const MIN_CONFIDENCE = 0.4;
    const MIN_USERS = 2;
    const suggestions: TagSuggestion[] = [];

    // Vibe-based suggestions
    const VIBE_TAG_MAP: Record<string, string[]> = {
      romantic: ["romantisch", "date-night", "candlelight"],
      casual: ["casual", "entspannt", "locker"],
      trendy: ["trendy", "hip", "modern"],
      cozy: ["gemütlich", "cozy", "warm"],
      lively: ["lebhaft", "live-musik", "buzzing"],
      elegant: ["elegant", "upscale", "fine-dining"],
      adventurous: ["unique", "experience", "abenteuer"],
      cultural: ["kulturell", "kunst", "historisch"],
      outdoor: ["outdoor", "terrasse", "garten"],
      family: ["familienfreundlich", "kinderfreundlich"],
    };

    for (const [vibe, count] of vibeCounts) {
      const confidence = count / totalUsers;
      if (confidence >= MIN_CONFIDENCE && count >= MIN_USERS) {
        const possibleTags = VIBE_TAG_MAP[vibe] || [vibe];
        for (const tag of possibleTags) {
          if (!existingTags.has(tag)) {
            suggestions.push({
              tag,
              confidence: Math.round(confidence * 100) / 100,
              reason: `${count} von ${totalUsers} zufriedenen Gästen bevorzugen "${vibe}" Vibes`,
              sourceCount: count,
            });
            break; // Only suggest one tag per vibe
          }
        }
      }
    }

    // Time-based suggestions
    const TIME_TAG_MAP: Record<string, string> = {
      brunch: "brunch-spot",
      lunch: "mittagstisch",
      dinner: "dinner-location",
      evening: "abendprogramm",
    };

    for (const [time, count] of timeCounts) {
      const confidence = count / totalUsers;
      if (confidence >= 0.5 && count >= MIN_USERS) {
        const tag = TIME_TAG_MAP[time];
        if (tag && !existingTags.has(tag)) {
          suggestions.push({
            tag,
            confidence: Math.round(confidence * 100) / 100,
            reason: `${count} von ${totalUsers} zufriedenen Gästen kamen zur ${time}-Zeit`,
            sourceCount: count,
          });
        }
      }
    }

    // Pair-friendly suggestion based on high ratings from both partners
    const bothRatedHigh = invitations.filter(inv => {
      const senderFeedback = feedback?.find(f => f.user_id === inv.sender_id);
      const recipientFeedback = feedback?.find(f => f.user_id === inv.recipient_id);
      return senderFeedback && recipientFeedback &&
        (senderFeedback.rating || 0) >= 4 && (recipientFeedback.rating || 0) >= 4;
    });

    if (bothRatedHigh.length >= 2 && !existingTags.has("paar-empfehlung")) {
      suggestions.push({
        tag: "paar-empfehlung",
        confidence: Math.min(bothRatedHigh.length / invitations.length, 1),
        reason: `${bothRatedHigh.length} Paare haben beide 4+ Sterne gegeben`,
        sourceCount: bothRatedHigh.length,
      });
    }

    // Sort by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);

    return new Response(JSON.stringify({
      suggestions: suggestions.slice(0, 8),
      analyzedUsers: totalUsers,
      analyzedDates: invitations.length,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Tag learning error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
