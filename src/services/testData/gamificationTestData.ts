import { supabase } from '@/integrations/supabase/client';

/**
 * Creates test data for gamification system testing
 * - Sets up completed dates in the past
 * - Initializes user points if needed
 * - Ensures test users have friendships
 */
export async function createGamificationTestData() {
  console.log('🧪 Creating gamification test data...');
  
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
      // Supabase returns profiles as an object, not array, when using foreign key relationship
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
    const { data: existingPoints } = await supabase
      .from('user_points')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!existingPoints) {
      const { error: pointsError } = await supabase
        .from('user_points')
        .insert({
          user_id: user.id,
          total_points: 0,
          level: 1,
          badges: [],
        });

      if (pointsError) {
        console.error('❌ Error initializing user points:', pointsError);
      } else {
        console.log('✓ Initialized user points');
      }
    } else {
      console.log('✓ User points already exist');
    }

    // Initialize points for friends too
    for (const friend of friendships) {
      const { data: friendPoints } = await supabase
        .from('user_points')
        .select('user_id')
        .eq('user_id', friend.friend_id)
        .single();

      if (!friendPoints) {
        await supabase
          .from('user_points')
          .insert({
            user_id: friend.friend_id,
            total_points: 0,
            level: 1,
            badges: [],
          });
        console.log(`✓ Initialized points for friend ${friend.friend_id}`);
      }
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
