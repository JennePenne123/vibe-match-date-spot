import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate with CRON_SECRET
  const cronSecret = Deno.env.get('CRON_SECRET');
  const providedSecret = req.headers.get('x-cron-secret');

  if (!cronSecret || providedSecret !== cronSecret) {
    console.warn('⚠️ Unauthorized access attempt to check-streaks');
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('🔥 Check Streaks - Starting daily scan...');

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users with active streaks or recent review activity
    const { data: allPoints, error: fetchError } = await supabase
      .from('user_points')
      .select('user_id, streak_count, last_review_date, total_points, level, badges');

    if (fetchError) {
      console.error('❌ Error fetching user points:', fetchError);
      throw fetchError;
    }

    if (!allPoints || allPoints.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No users to check', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    let streaksUpdated = 0;
    let streaksBroken = 0;
    let bonusesAwarded = 0;

    for (const userPoints of allPoints) {
      const lastReview = userPoints.last_review_date
        ? new Date(userPoints.last_review_date)
        : null;

      // If user reviewed within the last 24h, increment streak
      if (lastReview && lastReview >= oneDayAgo) {
        // Already counted today, skip
        continue;
      }

      // If last review was 24-48h ago, streak is still alive but no new activity
      // If last review was >48h ago, break the streak
      if (!lastReview || lastReview < twoDaysAgo) {
        if (userPoints.streak_count > 0) {
          await supabase
            .from('user_points')
            .update({ streak_count: 0 })
            .eq('user_id', userPoints.user_id);
          streaksBroken++;
          console.log(`  💔 Streak broken for user ${userPoints.user_id.substring(0, 8)}...`);
        }
        continue;
      }

      // Check if streak hit 7-day milestone → award weekly bonus
      if (userPoints.streak_count > 0 && userPoints.streak_count % 7 === 0) {
        const WEEKLY_BONUS = 25;
        const newTotal = userPoints.total_points + WEEKLY_BONUS;

        // Calculate new level using same thresholds as client
        const LEVEL_THRESHOLDS = [0, 150, 500, 1000, 2000, 3500, 5500];
        let newLevel = 1;
        for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
          if (newTotal >= LEVEL_THRESHOLDS[i]) {
            newLevel = i + 1;
            break;
          }
        }

        await supabase
          .from('user_points')
          .update({
            total_points: newTotal,
            level: newLevel,
          })
          .eq('user_id', userPoints.user_id);

        bonusesAwarded++;
        console.log(`  🎉 Weekly streak bonus (+${WEEKLY_BONUS}) for user ${userPoints.user_id.substring(0, 8)}... (streak: ${userPoints.streak_count})`);
      }

      streaksUpdated++;
    }

    const summary = {
      success: true,
      checked: allPoints.length,
      streaksUpdated,
      streaksBroken,
      bonusesAwarded,
    };

    console.log('✅ Streak check complete:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in check-streaks:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
