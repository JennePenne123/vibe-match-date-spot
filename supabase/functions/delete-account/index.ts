import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create client with user's JWT to verify identity
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    console.log(`[delete-account] Starting deletion for user ${userId}`);

    // Use service role client to delete data (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Delete all user data from all tables in correct order (respecting FK constraints)
    const tables = [
      { table: 'ai_learning_data', column: 'user_id' },
      { table: 'ai_venue_scores', column: 'user_id' },
      { table: 'ai_compatibility_scores', column: 'user1_id', column2: 'user2_id' },
      { table: 'ai_date_recommendations', column: 'user1_id', column2: 'user2_id' },
      { table: 'user_venue_feedback', column: 'user_id' },
      { table: 'user_preference_vectors', column: 'user_id' },
      { table: 'user_preferences', column: 'user_id' },
      { table: 'push_subscriptions', column: 'user_id' },
      { table: 'referrals', column: 'referrer_id', column2: 'referee_id' },
      { table: 'reward_redemptions', column: 'user_id' },
      { table: 'feedback_rewards', column: 'user_id' },
      { table: 'date_feedback', column: 'user_id' },
      { table: 'invitation_messages', column: 'sender_id' },
      { table: 'date_proposals', column: 'proposer_id', column2: 'recipient_id' },
      { table: 'date_invitations', column: 'sender_id', column2: 'recipient_id' },
      { table: 'date_group_messages', column: 'sender_id' },
      { table: 'date_group_members', column: 'user_id' },
      { table: 'friendships', column: 'user_id', column2: 'friend_id' },
      { table: 'date_planning_sessions', column: 'initiator_id', column2: 'partner_id' },
      { table: 'error_logs', column: 'user_id' },
      { table: 'api_usage_logs', column: 'user_id' },
      { table: 'user_points', column: 'user_id' },
      { table: 'user_roles', column: 'user_id' },
      { table: 'profiles', column: 'id' },
    ];

    for (const { table, column, column2 } of tables) {
      if (column2) {
        const { error } = await serviceClient
          .from(table)
          .delete()
          .or(`${column}.eq.${userId},${column2}.eq.${userId}`);
        if (error) console.warn(`[delete-account] Warning deleting from ${table}:`, error.message);
      } else {
        const { error } = await serviceClient
          .from(table)
          .delete()
          .eq(column, userId);
        if (error) console.warn(`[delete-account] Warning deleting from ${table}:`, error.message);
      }
    }

    // Finally, delete the auth user
    const { error: deleteAuthError } = await serviceClient.auth.admin.deleteUser(userId);
    if (deleteAuthError) {
      console.error(`[delete-account] Error deleting auth user:`, deleteAuthError.message);
      return new Response(JSON.stringify({ error: 'Failed to delete auth user' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[delete-account] Successfully deleted user ${userId}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[delete-account] Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
