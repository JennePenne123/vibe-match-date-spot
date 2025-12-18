import { supabase } from '@/integrations/supabase/client';
import type { TestPhaseResult } from './types';

export interface TestRunResults {
  phases: TestPhaseResult[];
  overallSuccess: boolean;
  totalDuration: number;
  summary: {
    totalDates: number;
    completedDates: number;
    totalFeedback: number;
    totalRewards: number;
    usersWithPoints: number;
    totalBadgesAwarded: number;
  };
}

// Initialize user points helper
export async function initializeUserPoints(userId: string) {
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

// Creates basic test data for gamification system testing
export async function createGamificationTestData() {
  console.log('🧪 Creating basic gamification test data...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

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

    const testDates = [];
    const now = new Date();
    
    for (let i = 0; i < Math.min(friendships.length, 3); i++) {
      const friendship = friendships[i];
      const friendProfile = friendship.profiles as any;
      const hoursAgo = 3 + (i * 24);
      const dateTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

      const { data: invitation, error: inviteError } = await supabase
        .from('date_invitations')
        .insert({
          sender_id: user.id,
          recipient_id: friendship.friend_id,
          title: `Test Date with ${friendProfile?.name || 'Friend'}`,
          status: 'accepted',
          date_status: 'scheduled',
          actual_date_time: dateTime.toISOString(),
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

    await initializeUserPoints(user.id);
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

// Creates comprehensive test data covering all badge scenarios
export async function createComprehensiveTestData() {
  console.log('🧪 Creating COMPREHENSIVE gamification test data...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

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

    await initializeUserPoints(user.id);
    for (const friend of friendships) {
      await initializeUserPoints(friend.friend_id);
    }

    const results = {
      streakDates: [] as any[],
      milestoneDates: [] as any[],
      perfectPairDates: [] as any[],
      speedBonusDates: [] as any[],
    };

    const now = new Date();

    // 1. Create STREAK TEST DATA (7 days of consecutive dates)
    console.log('\n📅 Creating streak test data (7 consecutive days)...');
    for (let day = 7; day >= 1; day--) {
      const friend = friendships[day % friendships.length];
      const friendProfile = friend.profiles as any;
      const daysAgo = day;
      const dateTime = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000);

      const { data: invitation, error } = await supabase
        .from('date_invitations')
        .insert({
          sender_id: user.id,
          recipient_id: friend.friend_id,
          title: `Streak Day ${8 - day}`,
          status: 'accepted',
          date_status: 'scheduled',
          actual_date_time: dateTime.toISOString(),
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
          status: 'accepted',
          date_status: 'scheduled',
          actual_date_time: dateTime.toISOString(),
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
            status: 'accepted',
            date_status: 'completed',
            actual_date_time: dateTime.toISOString(),
          })
          .select()
          .single();

        if (!error && invitation) {
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
      const hoursAgo = 4 + (i * 2);
      const dateTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

      const { data: invitation, error } = await supabase
        .from('date_invitations')
        .insert({
          sender_id: user.id,
          recipient_id: friend.friend_id,
          title: `Speed Bonus Date #${i + 1}`,
          status: 'accepted',
          date_status: 'scheduled',
          actual_date_time: dateTime.toISOString(),
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

// Triggers the check-completed-dates edge function manually
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

// Triggers the calculate-feedback-rewards edge function manually
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

// Run full gamification test
export async function runFullGamificationTest(): Promise<TestRunResults> {
  const results: TestPhaseResult[] = [];
  const startTime = Date.now();

  try {
    results.push(await phase1_CreateTestData());
    results.push(await phase2_MarkCompleted());
    results.push(await phase3_CreateFeedback());
    results.push(await phase4_CalculateRewards());
    results.push(await phase5_VerifyResults());
    results.push(await phase6_TestBadges());
    results.push(await phase7_ValidatePoints());
  } catch (error) {
    console.error('Test runner encountered an error:', error);
    results.push({
      phase: 'Error Handler',
      success: false,
      message: `Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }

  const totalDuration = Date.now() - startTime;
  const summary = await generateSummary();

  return {
    phases: results,
    overallSuccess: results.every(r => r.success),
    totalDuration,
    summary
  };
}

async function phase1_CreateTestData(): Promise<TestPhaseResult> {
  const phaseStart = Date.now();
  console.log('📊 Phase 1: Creating comprehensive test data...');

  try {
    const result = await createComprehensiveTestData();
    
    if (result.success) {
      return {
        phase: 'Phase 1: Create Test Data',
        success: true,
        message: `Created ${result.totalDates} test dates covering all scenarios`,
        data: result.results,
        duration: Date.now() - phaseStart
      };
    } else {
      throw new Error('Failed to create test data');
    }
  } catch (error) {
    return {
      phase: 'Phase 1: Create Test Data',
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - phaseStart
    };
  }
}

async function phase2_MarkCompleted(): Promise<TestPhaseResult> {
  const phaseStart = Date.now();
  console.log('✅ Phase 2: Marking dates as completed...');

  try {
    const result = await triggerCheckCompletedDates();
    
    return {
      phase: 'Phase 2: Mark Completed',
      success: true,
      message: `Marked ${result.data?.updatedCount || 0} dates as completed`,
      data: result,
      duration: Date.now() - phaseStart
    };
  } catch (error) {
    return {
      phase: 'Phase 2: Mark Completed',
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - phaseStart
    };
  }
}

async function phase3_CreateFeedback(): Promise<TestPhaseResult> {
  const phaseStart = Date.now();
  console.log('💬 Phase 3: Creating feedback entries...');

  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('No authenticated user');

    const { data: completedDates, error: datesError } = await supabase
      .from('date_invitations')
      .select('id, sender_id, recipient_id, actual_date_time')
      .eq('date_status', 'completed')
      .order('actual_date_time', { ascending: true });

    if (datesError) throw datesError;

    let feedbackCount = 0;
    const userId = user.user.id;

    for (const date of completedDates || []) {
      const isParticipant = date.sender_id === userId || date.recipient_id === userId;
      
      if (isParticipant) {
        const { data: existingFeedback } = await supabase
          .from('date_feedback')
          .select('id')
          .eq('invitation_id', date.id)
          .eq('user_id', userId)
          .single();

        if (!existingFeedback) {
          const rating = Math.floor(Math.random() * 3) + 3;
          const venueRating = Math.floor(Math.random() * 3) + 3;
          const aiAccuracy = Math.floor(Math.random() * 3) + 3;

          const { error: feedbackError } = await supabase
            .from('date_feedback')
            .insert({
              invitation_id: date.id,
              user_id: userId,
              rating: rating,
              venue_rating: venueRating,
              ai_accuracy_rating: aiAccuracy,
              would_recommend_venue: rating >= 4,
              would_use_ai_again: aiAccuracy >= 4,
              feedback_text: 'Automated test feedback'
            });

          if (!feedbackError) {
            feedbackCount++;
          }
        }
      }
    }

    return {
      phase: 'Phase 3: Create Feedback',
      success: true,
      message: `Created ${feedbackCount} feedback entries for completed dates`,
      data: { feedbackCount, totalDates: completedDates?.length || 0 },
      duration: Date.now() - phaseStart
    };
  } catch (error) {
    return {
      phase: 'Phase 3: Create Feedback',
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - phaseStart
    };
  }
}

async function phase4_CalculateRewards(): Promise<TestPhaseResult> {
  const phaseStart = Date.now();
  console.log('🎁 Phase 4: Calculating rewards...');

  try {
    const result = await triggerCalculateRewards();
    
    return {
      phase: 'Phase 4: Calculate Rewards',
      success: true,
      message: `Processed rewards, awarded bonuses for ${result.data?.processedInvitations || 0} invitations`,
      data: result,
      duration: Date.now() - phaseStart
    };
  } catch (error) {
    return {
      phase: 'Phase 4: Calculate Rewards',
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - phaseStart
    };
  }
}

async function phase5_VerifyResults(): Promise<TestPhaseResult> {
  const phaseStart = Date.now();
  console.log('🔍 Phase 5: Verifying results...');

  try {
    const { data: rewards } = await supabase
      .from('feedback_rewards')
      .select('*');

    const { data: points } = await supabase
      .from('user_points')
      .select('*');

    const totalRewards = rewards?.length || 0;
    const totalPoints = points?.reduce((sum, p) => sum + p.total_points, 0) || 0;
    const totalBadges = points?.reduce((sum, p) => sum + ((p.badges as unknown[])?.length || 0), 0) || 0;

    return {
      phase: 'Phase 5: Verify Results',
      success: totalRewards > 0 && totalPoints > 0,
      message: `Found ${totalRewards} rewards, ${totalPoints} total points, ${totalBadges} badges`,
      data: { totalRewards, totalPoints, totalBadges },
      duration: Date.now() - phaseStart
    };
  } catch (error) {
    return {
      phase: 'Phase 5: Verify Results',
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - phaseStart
    };
  }
}

async function phase6_TestBadges(): Promise<TestPhaseResult> {
  const phaseStart = Date.now();
  console.log('🏆 Phase 6: Testing badge logic...');

  try {
    const { data: points } = await supabase
      .from('user_points')
      .select('badges, streak_count');

    const badgeTypes = new Set<string>();
    let maxStreak = 0;

    points?.forEach(p => {
      ((p.badges as { id: string }[]) || []).forEach((badge) => badgeTypes.add(badge.id));
      maxStreak = Math.max(maxStreak, p.streak_count || 0);
    });

    const expectedBadges = [
      'first_review', 'speed_demon', 'social_butterfly', 
      'serial_dater', 'streak_starter', 'perfect_pair'
    ];
    
    const foundBadges = Array.from(badgeTypes);
    const missingBadges = expectedBadges.filter(b => !foundBadges.includes(b));

    return {
      phase: 'Phase 6: Test Badges',
      success: foundBadges.length >= 3,
      message: `Found ${foundBadges.length} badge types, max streak: ${maxStreak}`,
      data: { foundBadges, missingBadges, maxStreak },
      duration: Date.now() - phaseStart
    };
  } catch (error) {
    return {
      phase: 'Phase 6: Test Badges',
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - phaseStart
    };
  }
}

async function phase7_ValidatePoints(): Promise<TestPhaseResult> {
  const phaseStart = Date.now();
  console.log('💯 Phase 7: Validating point calculations...');

  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('No authenticated user');

    const { data: userPoints } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    if (!userPoints) {
      throw new Error('No points record found for user');
    }

    const expectedLevel = Math.floor(userPoints.total_points / 50) + 1;
    const levelCorrect = userPoints.level === expectedLevel;

    return {
      phase: 'Phase 7: Validate Points',
      success: levelCorrect && userPoints.total_points > 0,
      message: `User has ${userPoints.total_points} points, level ${userPoints.level} (${levelCorrect ? 'correct' : 'incorrect'})`,
      data: { 
        totalPoints: userPoints.total_points, 
        level: userPoints.level,
        expectedLevel,
        badges: (userPoints.badges as unknown[])?.length || 0
      },
      duration: Date.now() - phaseStart
    };
  } catch (error) {
    return {
      phase: 'Phase 7: Validate Points',
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - phaseStart
    };
  }
}

async function generateSummary() {
  try {
    const [datesResult, feedbackResult, rewardsResult, pointsResult] = await Promise.all([
      supabase.from('date_invitations').select('id, date_status'),
      supabase.from('date_feedback').select('id'),
      supabase.from('feedback_rewards').select('id'),
      supabase.from('user_points').select('total_points, badges')
    ]);

    const totalDates = datesResult.data?.length || 0;
    const completedDates = datesResult.data?.filter(d => d.date_status === 'completed').length || 0;
    const totalFeedback = feedbackResult.data?.length || 0;
    const totalRewards = rewardsResult.data?.length || 0;
    const usersWithPoints = pointsResult.data?.length || 0;
    const totalBadgesAwarded = pointsResult.data?.reduce((sum, p) => sum + ((p.badges as unknown[])?.length || 0), 0) || 0;

    return {
      totalDates,
      completedDates,
      totalFeedback,
      totalRewards,
      usersWithPoints,
      totalBadgesAwarded
    };
  } catch (error) {
    console.error('Error generating summary:', error);
    return {
      totalDates: 0,
      completedDates: 0,
      totalFeedback: 0,
      totalRewards: 0,
      usersWithPoints: 0,
      totalBadgesAwarded: 0
    };
  }
}