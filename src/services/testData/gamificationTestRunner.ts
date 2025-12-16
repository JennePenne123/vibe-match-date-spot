import { supabase } from '@/integrations/supabase/client';
import { createComprehensiveTestData } from './gamificationTestData';
import { triggerCheckCompletedDates, triggerCalculateRewards } from './gamificationTestData';
import type { TestPhaseResult } from './types';

// Re-export for backward compatibility
export type { TestPhaseResult } from './types';

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

export async function runFullGamificationTest(): Promise<TestRunResults> {
  const results: TestPhaseResult[] = [];
  const startTime = Date.now();

  try {
    // Phase 1: Create Comprehensive Test Data
    results.push(await phase1_CreateTestData());
    
    // Phase 2: Mark Dates as Completed
    results.push(await phase2_MarkCompleted());
    
    // Phase 3: Create Feedback Entries
    results.push(await phase3_CreateFeedback());
    
    // Phase 4: Calculate Rewards
    results.push(await phase4_CalculateRewards());
    
    // Phase 5: Verify Results
    results.push(await phase5_VerifyResults());
    
    // Phase 6: Test Badge Logic
    results.push(await phase6_TestBadges());
    
    // Phase 7: Validate Point Calculations
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

    // Get all completed dates without feedback
    const { data: completedDates, error: datesError } = await supabase
      .from('date_invitations')
      .select('id, sender_id, recipient_id, actual_date_time')
      .eq('date_status', 'completed')
      .order('actual_date_time', { ascending: true });

    if (datesError) throw datesError;

    let feedbackCount = 0;
    const userId = user.user.id;

    // Create feedback for dates involving the current user
    for (const date of completedDates || []) {
      // Determine if user is sender or recipient
      const isParticipant = date.sender_id === userId || date.recipient_id === userId;
      
      if (isParticipant) {
        // Check if feedback already exists
        const { data: existingFeedback } = await supabase
          .from('date_feedback')
          .select('id')
          .eq('invitation_id', date.id)
          .eq('user_id', userId)
          .single();

        if (!existingFeedback) {
          // Create varied feedback (mix of ratings)
          const rating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
          const venueRating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
          const aiAccuracy = Math.floor(Math.random() * 3) + 3; // 3-5 stars

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
      success: foundBadges.length >= 3, // At least 3 different badge types
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

    // Verify level calculation (50 points per level)
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
