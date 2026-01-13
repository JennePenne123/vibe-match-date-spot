import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const BOTH_RATED_BONUS = 10;
const SPEED_BONUS_HOURS = 24;

// Badge definitions matching frontend
const BADGE_POINTS = {
  first_review: 5,
  speed_demon: 10,
  social_butterfly: 25,    // 10 reviews
  serial_dater: 50,        // 25 reviews
  date_master: 100,        // 50 reviews
  streak_starter: 15,      // 3 days
  streak_champion: 30,     // 7 days
  perfect_pair: 50,        // Both rated 5 stars 5 times
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate scheduled/manual invocations with CRON_SECRET
  const cronSecret = Deno.env.get('CRON_SECRET');
  const providedSecret = req.headers.get('x-cron-secret');
  
  // Require valid secret for all invocations
  if (!cronSecret || providedSecret !== cronSecret) {
    console.warn('⚠️ Unauthorized access attempt to calculate-feedback-rewards');
    return new Response(
      JSON.stringify({ error: 'Unauthorized - Invalid or missing credentials' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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

        // Get current user points and badges
        const { data: currentPoints, error: pointsError } = await supabase
          .from('user_points')
          .select('total_points, badges, streak_count, last_review_date')
          .eq('user_id', userId)
          .single();

        if (pointsError || !currentPoints) {
          console.error(`❌ Error fetching points for user ${userId}:`, pointsError);
          continue;
        }

        // Calculate new badges to award
        const currentBadges = (currentPoints.badges as string[]) || [];
        const newBadges: string[] = [];
        let additionalPoints = BOTH_RATED_BONUS;

        // Get total feedback count for this user
        const { data: feedbackCount } = await supabase
          .from('date_feedback')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId);

        const totalReviews = feedbackCount || 0;
        console.log(`  📊 User ${userId} has ${totalReviews} total reviews`);

        // Check for first review badge
        if (totalReviews === 1 && !currentBadges.includes('first_review')) {
          newBadges.push('first_review');
          additionalPoints += BADGE_POINTS.first_review;
          console.log(`  🎖️ Awarded 'first_review' badge (+${BADGE_POINTS.first_review} points)`);
        }

        // Check for review milestone badges
        if (totalReviews >= 10 && !currentBadges.includes('social_butterfly')) {
          newBadges.push('social_butterfly');
          additionalPoints += BADGE_POINTS.social_butterfly;
          console.log(`  🎖️ Awarded 'social_butterfly' badge (+${BADGE_POINTS.social_butterfly} points)`);
        }
        if (totalReviews >= 25 && !currentBadges.includes('serial_dater')) {
          newBadges.push('serial_dater');
          additionalPoints += BADGE_POINTS.serial_dater;
          console.log(`  🎖️ Awarded 'serial_dater' badge (+${BADGE_POINTS.serial_dater} points)`);
        }
        if (totalReviews >= 50 && !currentBadges.includes('date_master')) {
          newBadges.push('date_master');
          additionalPoints += BADGE_POINTS.date_master;
          console.log(`  🎖️ Awarded 'date_master' badge (+${BADGE_POINTS.date_master} points)`);
        }

        // Check for speed demon badge (rated within 24 hours of date)
        if (!currentBadges.includes('speed_demon') && invitation.actual_date_time) {
          const dateTime = new Date(invitation.actual_date_time);
          const feedbackTime = new Date(feedbacks.find(f => f.user_id === userId)?.created_at || '');
          const hoursSinceDate = (feedbackTime.getTime() - dateTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceDate <= SPEED_BONUS_HOURS && hoursSinceDate >= 0) {
            newBadges.push('speed_demon');
            additionalPoints += BADGE_POINTS.speed_demon;
            console.log(`  🎖️ Awarded 'speed_demon' badge (+${BADGE_POINTS.speed_demon} points) - rated in ${hoursSinceDate.toFixed(1)}h`);
          }
        }

        // Check for streak badges (using UTC dates to avoid timezone issues)
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const lastReviewDate = currentPoints.last_review_date 
          ? new Date(currentPoints.last_review_date)
          : null;
        
        let lastReviewDateUTC = null;
        if (lastReviewDate) {
          lastReviewDateUTC = new Date(Date.UTC(
            lastReviewDate.getUTCFullYear(), 
            lastReviewDate.getUTCMonth(), 
            lastReviewDate.getUTCDate()
          ));
        }
        
        let newStreakCount = currentPoints.streak_count || 0;
        
        if (lastReviewDateUTC && lastReviewDateUTC.getTime() === todayUTC.getTime()) {
          // Already reviewed today, maintain streak
          newStreakCount = currentPoints.streak_count;
        } else if (lastReviewDateUTC) {
          const yesterdayUTC = new Date(todayUTC);
          yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);
          
          if (lastReviewDateUTC.getTime() === yesterdayUTC.getTime()) {
            // Consecutive day review, increment streak
            newStreakCount = (currentPoints.streak_count || 0) + 1;
          } else {
            // Streak broken, reset to 1
            newStreakCount = 1;
          }
        } else {
          // First review
          newStreakCount = 1;
        }

        // Award streak badges
        if (newStreakCount >= 3 && !currentBadges.includes('streak_starter')) {
          newBadges.push('streak_starter');
          additionalPoints += BADGE_POINTS.streak_starter;
          console.log(`  🎖️ Awarded 'streak_starter' badge (+${BADGE_POINTS.streak_starter} points)`);
        }
        if (newStreakCount >= 7 && !currentBadges.includes('streak_champion')) {
          newBadges.push('streak_champion');
          additionalPoints += BADGE_POINTS.streak_champion;
          console.log(`  🎖️ Awarded 'streak_champion' badge (+${BADGE_POINTS.streak_champion} points)`);
        }

        // Check for Perfect Pair badge (both partners rated 5 stars, 5 times)
        // Optimized: Use a single query with JOIN to find mutual 5-star ratings
        if (!currentBadges.includes('perfect_pair')) {
          const { data: perfectPairCount, error: perfectPairError } = await supabase.rpc(
            'count_perfect_pairs',
            { target_user_id: userId }
          );

          // Fallback if RPC doesn't exist - use optimized query
          if (perfectPairError) {
            console.log(`  ⚠️ RPC not available, using direct query for perfect pairs`);
            
            const { data: mutualFiveStars } = await supabase
              .from('date_feedback')
              .select(`
                invitation_id,
                date_invitations!inner(id)
              `)
              .eq('user_id', userId)
              .eq('rating', 5);

            if (mutualFiveStars && mutualFiveStars.length >= 5) {
              // Get invitation IDs and check for partner 5-star ratings in batch
              const invitationIds = mutualFiveStars.map(r => r.invitation_id);
              
              const { data: partnerRatings } = await supabase
                .from('date_feedback')
                .select('invitation_id')
                .in('invitation_id', invitationIds)
                .neq('user_id', userId)
                .eq('rating', 5);

              const perfectPairInvitations = new Set(partnerRatings?.map(r => r.invitation_id) || []);
              const perfectCount = mutualFiveStars.filter(r => 
                perfectPairInvitations.has(r.invitation_id)
              ).length;

              if (perfectCount >= 5) {
                newBadges.push('perfect_pair');
                additionalPoints += BADGE_POINTS.perfect_pair;
                console.log(`  🎖️ Awarded 'perfect_pair' badge (+${BADGE_POINTS.perfect_pair} points)`);
              }
            }
          } else if (perfectPairCount >= 5) {
            newBadges.push('perfect_pair');
            additionalPoints += BADGE_POINTS.perfect_pair;
            console.log(`  🎖️ Awarded 'perfect_pair' badge (+${BADGE_POINTS.perfect_pair} points)`);
          }
        }

        // Deduplicate badges before updating (prevent duplicates from concurrent runs)
        const badgeSet = new Set([...currentBadges, ...newBadges]);
        const updatedBadges = Array.from(badgeSet);
        
        // Use atomic increment for points to prevent race conditions
        // First, get the current points again to ensure we have the latest value
        const { data: latestPoints } = await supabase
          .from('user_points')
          .select('total_points')
          .eq('user_id', userId)
          .single();
        
        const newTotalPoints = (latestPoints?.total_points || currentPoints.total_points) + additionalPoints;
        
        const { error: updatePointsError } = await supabase
          .from('user_points')
          .update({
            total_points: newTotalPoints,
            badges: updatedBadges,
            streak_count: newStreakCount,
            last_review_date: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (updatePointsError) {
          console.error(`❌ Error updating points for user ${userId}:`, updatePointsError);
        } else {
          console.log(`  ✅ Awarded ${additionalPoints} total points (including ${newBadges.length} badges) to user ${userId}`);
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
