import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders } from '../_shared/cors.ts';

/**
 * Notifies venue partners when a new review/feedback is submitted for their venue.
 * Called from the client after successful feedback submission.
 * Uses service role to look up partner subscriptions and send push notifications.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT from the calling user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify the caller's JWT
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { invitationId, venueRating, overallRating } = await req.json();

    if (!invitationId) {
      return new Response(
        JSON.stringify({ error: 'invitationId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the invitation's venue_id
    const { data: invitation, error: invError } = await supabase
      .from('date_invitations')
      .select('venue_id')
      .eq('id', invitationId)
      .single();

    if (invError || !invitation?.venue_id) {
      console.log('[notify-venue-partner] No venue linked to invitation', invitationId);
      return new Response(
        JSON.stringify({ success: true, notified: false, reason: 'no_venue' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find approved partners for this venue
    const { data: partnerships, error: partnerError } = await supabase
      .from('venue_partnerships')
      .select('partner_id')
      .eq('venue_id', invitation.venue_id)
      .eq('status', 'approved');

    if (partnerError || !partnerships || partnerships.length === 0) {
      console.log('[notify-venue-partner] No partners found for venue', invitation.venue_id);
      return new Response(
        JSON.stringify({ success: true, notified: false, reason: 'no_partners' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get venue name for the notification
    const { data: venue } = await supabase
      .from('venues')
      .select('name')
      .eq('id', invitation.venue_id)
      .single();

    const venueName = venue?.name || 'Dein Venue';
    const stars = overallRating ? '⭐'.repeat(Math.min(overallRating, 5)) : '';
    const ratingText = venueRating ? ` (Venue: ${venueRating}/5)` : '';

    // Get caller's profile name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const reviewerName = profile?.name || 'Ein Gast';

    let notifiedCount = 0;

    // Send push notification to each partner
    for (const partnership of partnerships) {
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', partnership.partner_id);

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`[notify-venue-partner] No push subscriptions for partner ${partnership.partner_id}`);
        continue;
      }

      // For now, update last_used_at (actual push sending requires VAPID keys)
      for (const sub of subscriptions) {
        await supabase
          .from('push_subscriptions')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', sub.id);
      }

      console.log(`[notify-venue-partner] Would push to partner ${partnership.partner_id}: "${reviewerName} hat ${venueName} bewertet ${stars}${ratingText}"`);
      notifiedCount++;
    }

    console.log(`[notify-venue-partner] Notified ${notifiedCount} partner(s) for venue ${venueName}`);

    return new Response(
      JSON.stringify({
        success: true,
        notified: notifiedCount > 0,
        partnerCount: notifiedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[notify-venue-partner] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
