import { supabase } from '@/integrations/supabase/client';

/**
 * Creates basic test data for gamification system testing
 * - Sets up completed dates in the past
 * - Initializes user points if needed
 * - Ensures test users have friendships
 */
export async function createGamificationTestData() {
  console.log('🧪 Creating basic gamification test data...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get current user's friends
    const { data: friendships, error: friendshipError } = await supabase
      .from('friendships')
      .select(`
        friend_id,
        profiles:friend_id (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .limit(3);

    if (friendshipError) throw friendshipError;
    
    if (!friendships || friendships.length === 0) {
      console.log('⚠️ No friends found. Please add friends first.');
      return { success: false, message: 'No friends found. Please add friends first.' };
    }

    console.log(`✓ Found ${friendships.length} friends`);

    // Create test completed dates (in the past, over 2 hours ago)
    const testDates = [];
    const now = new Date();
    
    for (let i = 0; i < Math.min(friendships.length, 3); i++) {
      const friendship = friendships[i];
      const friendProfile = friendship.profiles as any;
      const hoursAgo = 3 + (i * 24); // 3 hours, 27 hours, 51 hours ago
      const dateTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

      const { data: invitation, error: inviteError } = await supabase
        .from('date_invitations')
        .insert({
          sender_id: user.id,
          recipient_id: friendship.friend_id,
          title: `Test Date with ${friendProfile?.name || 'Friend'}`,
          description: 'Test date for gamification system',
          status: 'accepted',
          date_status: 'scheduled',
          actual_date_time: dateTime.toISOString(),
          venue_name: 'Test Restaurant',
          venue_address: '123 Test St',
        })
        .select()
        .single();

      if (inviteError) {
        console.error(`❌ Error creating test invitation ${i}:`, inviteError);
        continue;
      }

      testDates.push({
        id: invitation.id,
        partner: friendProfile?.name || 'Friend',
        dateTime: dateTime.toISOString(),
        hoursAgo,
      });

      console.log(`✓ Created test date ${i + 1}: ${hoursAgo} hours ago with ${friendProfile?.name}`);
    }

    // Initialize user points if not exists
    await initializeUserPoints(user.id);

    // Initialize points for friends too
    for (const friend of friendships) {
      await initializeUserPoints(friend.friend_id);
    }

    return {
      success: true,
      message: `Created ${testDates.length} test completed dates`,
      testDates,
    };
  } catch (error: any) {
    console.error('❌ Error creating gamification test data:', error);
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * Creates comprehensive test data covering all badge scenarios
 * - Streak testing (consecutive days)
 * - Review milestone testing (10, 25, 50 reviews)
 * - Perfect pair testing (mutual 5-star ratings)
 * - Speed bonus testing
 */
export async function createComprehensiveTestData() {
  console.log('🧪 Creating COMPREHENSIVE gamification test data...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get friends
    const { data: friendships, error: friendshipError } = await supabase
      .from('friendships')
      .select(`
        friend_id,
        profiles:friend_id (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'accepted')
      .limit(5);

    if (friendshipError) throw friendshipError;
    
    if (!friendships || friendships.length === 0) {
      return { success: false, message: 'No friends found. Please add friends first.' };
    }

    console.log(`✓ Found ${friendships.length} friends`);

    // Initialize points for all users
    await initializeUserPoints(user.id);
    for (const friend of friendships) {
      await initializeUserPoints(friend.friend_id);
    }

    const results = {
      streakDates: [],
      milestoneDates: [],
      perfectPairDates: [],
      speedBonusDates: [],
    };

    const now = new Date();

    // 1. Create STREAK TEST DATA (7 days of consecutive dates)
    console.log('\n📅 Creating streak test data (7 consecutive days)...');
    for (let day = 7; day >= 1; day--) {
      const friend = friendships[day % friendships.length];
      const friendProfile = friend.profiles as any;
      const daysAgo = day;
      const dateTime = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000); // 3 hours past midnight

      const { data: invitation, error } = await supabase
        .from('date_invitations')
        .insert({
          sender_id: user.id,
          recipient_id: friend.friend_id,
          title: `Streak Day ${8 - day}`,
          description: `Test date for ${daysAgo} days ago`,
          status: 'accepted',
          date_status: 'scheduled',
          actual_date_time: dateTime.toISOString(),
          venue_name: `Restaurant Day ${8 - day}`,
          venue_address: '123 Streak St',
        })
        .select()
        .single();

      if (!error && invitation) {
        results.streakDates.push({
          id: invitation.id,
          day: 8 - day,
          partner: friendProfile?.name,
          dateTime: dateTime.toISOString(),
        });
        console.log(`✓ Created streak day ${8 - day}: ${daysAgo} days ago`);
      }
    }

    // 2. Create MILESTONE TEST DATA (for 10+ reviews badge)
    console.log('\n📊 Creating milestone test data (12 dates for 10+ reviews)...');
    for (let i = 0; i < 12; i++) {
      const friend = friendships[i % friendships.length];
      const friendProfile = friend.profiles as any;
      const daysAgo = 10 + i;
      const dateTime = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      const { data: invitation, error } = await supabase
        .from('date_invitations')
        .insert({
          sender_id: user.id,
          recipient_id: friend.friend_id,
          title: `Milestone Date #${i + 1}`,
          description: `Test date for milestone testing`,
          status: 'accepted',
          date_status: 'scheduled',
          actual_date_time: dateTime.toISOString(),
          venue_name: `Milestone Restaurant ${i + 1}`,
          venue_address: '123 Milestone Ave',
        })
        .select()
        .single();

      if (!error && invitation) {
        results.milestoneDates.push({
          id: invitation.id,
          number: i + 1,
          partner: friendProfile?.name,
        });
        console.log(`✓ Created milestone date ${i + 1}`);
      }
    }

    // 3. Create PERFECT PAIR TEST DATA (6 dates with both 5-star ratings)
    console.log('\n⭐ Creating perfect pair test data (6 five-star dates)...');
    if (friendships.length > 0) {
      const perfectPairFriend = friendships[0];
      const friendProfile = perfectPairFriend.profiles as any;

      for (let i = 0; i < 6; i++) {
        const daysAgo = 25 + i;
        const dateTime = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        const { data: invitation, error } = await supabase
          .from('date_invitations')
          .insert({
            sender_id: user.id,
            recipient_id: perfectPairFriend.friend_id,
            title: `Perfect Pair Date #${i + 1}`,
            description: `Test date for perfect pair badge`,
            status: 'accepted',
            date_status: 'completed',
            actual_date_time: dateTime.toISOString(),
            venue_name: `Five Star Restaurant ${i + 1}`,
            venue_address: '123 Perfect St',
          })
          .select()
          .single();

        if (!error && invitation) {
          // Create 5-star ratings from both users
          await supabase.from('date_feedback').insert({
            invitation_id: invitation.id,
            user_id: user.id,
            rating: 5,
            venue_rating: 5,
            feedback_text: 'Perfect date!',
          });

          await supabase.from('date_feedback').insert({
            invitation_id: invitation.id,
            user_id: perfectPairFriend.friend_id,
            rating: 5,
            venue_rating: 5,
            feedback_text: 'Amazing experience!',
          });

          // Create feedback rewards
          const { data: userFeedback } = await supabase
            .from('date_feedback')
            .select('id')
            .eq('invitation_id', invitation.id)
            .eq('user_id', user.id)
            .single();

          const { data: partnerFeedback } = await supabase
            .from('date_feedback')
            .select('id')
            .eq('invitation_id', invitation.id)
            .eq('user_id', perfectPairFriend.friend_id)
            .single();

          if (userFeedback) {
            await supabase.from('feedback_rewards').insert({
              feedback_id: userFeedback.id,
              user_id: user.id,
              points_earned: 5,
              completion_level: 'complete',
            });
          }

          if (partnerFeedback) {
            await supabase.from('feedback_rewards').insert({
              feedback_id: partnerFeedback.id,
              user_id: perfectPairFriend.friend_id,
              points_earned: 5,
              completion_level: 'complete',
            });
          }

          results.perfectPairDates.push({
            id: invitation.id,
            number: i + 1,
            partner: friendProfile?.name,
          });
          console.log(`✓ Created perfect pair date ${i + 1} with mutual 5-star ratings`);
        }
      }
    }

    // 4. Create SPEED BONUS TEST DATA (2 recent dates for quick rating)
    console.log('\n⚡ Creating speed bonus test data (2 dates within 24h)...');
    for (let i = 0; i < 2; i++) {
      const friend = friendships[i % friendships.length];
      const friendProfile = friend.profiles as any;
      const hoursAgo = 4 + (i * 2); // 4 hours and 6 hours ago
      const dateTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

      const { data: invitation, error } = await supabase
        .from('date_invitations')
        .insert({
          sender_id: user.id,
          recipient_id: friend.friend_id,
          title: `Speed Bonus Date #${i + 1}`,
          description: `Test date for speed bonus`,
          status: 'accepted',
          date_status: 'scheduled',
          actual_date_time: dateTime.toISOString(),
          venue_name: `Quick Rating Restaurant ${i + 1}`,
          venue_address: '123 Speed Ave',
        })
        .select()
        .single();

      if (!error && invitation) {
        results.speedBonusDates.push({
          id: invitation.id,
          number: i + 1,
          partner: friendProfile?.name,
          hoursAgo,
        });
        console.log(`✓ Created speed bonus date ${i + 1}: ${hoursAgo} hours ago`);
      }
    }

    console.log('\n✅ Comprehensive test data creation complete!');
    console.log(`   - ${results.streakDates.length} streak dates (7 consecutive days)`);
    console.log(`   - ${results.milestoneDates.length} milestone dates (for 10+ reviews)`);
    console.log(`   - ${results.perfectPairDates.length} perfect pair dates (mutual 5-stars)`);
    console.log(`   - ${results.speedBonusDates.length} speed bonus dates (within 24h)`);

    return {
      success: true,
      message: 'Comprehensive test data created successfully',
      results,
      totalDates: results.streakDates.length + results.milestoneDates.length + 
                  results.perfectPairDates.length + results.speedBonusDates.length,
    };
  } catch (error: any) {
    console.error('❌ Error creating comprehensive test data:', error);
    return {
      success: false,
      message: error.message,
    };
  }
}

/**
 * Helper function to initialize user points
 */
async function initializeUserPoints(userId: string) {
  const { data: existingPoints } = await supabase
    .from('user_points')
    .select('user_id')
    .eq('user_id', userId)
    .single();

  if (!existingPoints) {
    const { error } = await supabase
      .from('user_points')
      .insert({
        user_id: userId,
        total_points: 0,
        level: 1,
        badges: [],
        streak_count: 0,
      });

    if (error) {
      console.error(`❌ Error initializing points for user ${userId}:`, error);
    } else {
      console.log(`✓ Initialized points for user ${userId}`);
    }
  }
}

/**
 * Triggers the check-completed-dates edge function manually
 */
export async function triggerCheckCompletedDates() {
  console.log('🔄 Manually triggering check-completed-dates...');
  
  try {
    const { data, error } = await supabase.functions.invoke('check-completed-dates', {
      body: { manual: true },
    });

    if (error) throw error;

    console.log('✅ Check completed dates response:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Error triggering check-completed-dates:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Triggers the calculate-feedback-rewards edge function manually
 */
export async function triggerCalculateRewards() {
  console.log('🔄 Manually triggering calculate-feedback-rewards...');
  
  try {
    const { data, error } = await supabase.functions.invoke('calculate-feedback-rewards', {
      body: { manual: true },
    });

    if (error) throw error;

    console.log('✅ Calculate rewards response:', data);
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Error triggering calculate-rewards:', error);
    return { success: false, error: error.message };
  }
}
