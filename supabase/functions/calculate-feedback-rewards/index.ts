import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const BOTH_RATED_BONUS = 10;
const SPEED_BONUS_HOURS = 24;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Check if this is a manual trigger (for testing)
  const url = new URL(req.url);
  const isManualTrigger = url.searchParams.get('manual') === 'true';
  
  console.log(`🎁 Calculate Feedback Rewards - Starting... ${isManualTrigger ? '[MANUAL TRIGGER]' : '[SCHEDULED]'}`);

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all feedback entries from the last 48 hours (to catch any missed runs)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    const { data: recentFeedback, error: feedbackError } = await supabase
      .from('date_feedback')
      .select('id, invitation_id, user_id, created_at')
      .gte('created_at', fortyEightHoursAgo)
      .order('created_at', { ascending: false });

    if (feedbackError) {
      console.error('❌ Error fetching feedback:', feedbackError);
      throw feedbackError;
    }

    console.log(`📊 Found ${recentFeedback?.length || 0} recent feedback entries`);

    if (!recentFeedback || recentFeedback.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No recent feedback to process',
          bonusesAwarded: 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group feedback by invitation_id
    const feedbackByInvitation = recentFeedback.reduce((acc, feedback) => {
      if (!acc[feedback.invitation_id]) {
        acc[feedback.invitation_id] = [];
      }
      acc[feedback.invitation_id].push(feedback);
      return acc;
    }, {} as Record<string, typeof recentFeedback>);

    let bonusesAwarded = 0;
    const processedInvitations = [];

    // Process each invitation that has feedback
    for (const [invitationId, feedbacks] of Object.entries(feedbackByInvitation)) {
      // Check if both partners have rated (need exactly 2 feedback entries)
      if (feedbacks.length < 2) {
        console.log(`⏳ Invitation ${invitationId}: Only ${feedbacks.length} rating(s), waiting for partner`);
        continue;
      }

      // Get the invitation details
      const { data: invitation, error: invError } = await supabase
        .from('date_invitations')
        .select('sender_id, recipient_id, actual_date_time')
        .eq('id', invitationId)
        .single();

      if (invError || !invitation) {
        console.error(`❌ Error fetching invitation ${invitationId}:`, invError);
        continue;
      }

      // Check if both sender and recipient have submitted feedback
      const senderFeedback = feedbacks.find(f => f.user_id === invitation.sender_id);
      const recipientFeedback = feedbacks.find(f => f.user_id === invitation.recipient_id);

      if (!senderFeedback || !recipientFeedback) {
        console.log(`⏳ Invitation ${invitationId}: Missing feedback from one partner`);
        continue;
      }

      // Check if bonuses already awarded
      const { data: existingRewards, error: rewardsError } = await supabase
        .from('feedback_rewards')
        .select('user_id, both_rated_bonus')
        .eq('feedback_id', senderFeedback.id)
        .or(`feedback_id.eq.${senderFeedback.id},feedback_id.eq.${recipientFeedback.id}`)
        .eq('both_rated_bonus', true);

      if (rewardsError) {
        console.error(`❌ Error checking existing rewards:`, rewardsError);
        continue;
      }

      if (existingRewards && existingRewards.length > 0) {
        console.log(`✓ Invitation ${invitationId}: Bonuses already awarded`);
        continue;
      }

      console.log(`🎉 Invitation ${invitationId}: Both partners rated! Awarding bonuses...`);

      // Award both-rated bonus to both users
      const usersToReward = [
        { userId: invitation.sender_id, feedbackId: senderFeedback.id },
        { userId: invitation.recipient_id, feedbackId: recipientFeedback.id },
      ];

      for (const { userId, feedbackId } of usersToReward) {
        // Update feedback_rewards to mark both_rated_bonus
        const { error: updateRewardError } = await supabase
          .from('feedback_rewards')
          .update({ both_rated_bonus: true })
          .eq('feedback_id', feedbackId);

        if (updateRewardError) {
          console.error(`❌ Error updating reward for user ${userId}:`, updateRewardError);
          continue;
        }

        // Award bonus points to user_points
        const { data: currentPoints, error: pointsError } = await supabase
          .from('user_points')
          .select('total_points, badges')
          .eq('user_id', userId)
          .single();

        if (pointsError || !currentPoints) {
          console.error(`❌ Error fetching points for user ${userId}:`, pointsError);
          continue;
        }

        const { error: updatePointsError } = await supabase
          .from('user_points')
          .update({
            total_points: currentPoints.total_points + BOTH_RATED_BONUS,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updatePointsError) {
          console.error(`❌ Error updating points for user ${userId}:`, updatePointsError);
        } else {
          console.log(`  ✅ Awarded ${BOTH_RATED_BONUS} bonus points to user ${userId}`);
          bonusesAwarded++;
        }
      }

      processedInvitations.push(invitationId);
    }

    console.log(`✅ Completed! Awarded bonuses for ${processedInvitations.length} invitations`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${processedInvitations.length} invitations`,
        bonusesAwarded: bonusesAwarded,
        processedInvitations: processedInvitations,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in calculate-feedback-rewards function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
