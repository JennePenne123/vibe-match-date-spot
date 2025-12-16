import { learnFromFeedback, getAIInsights, getUserLearningData, getUserPreferenceVectors } from '@/services/aiLearningService';
import type { TestPhaseResult } from './types';

// Re-export for backward compatibility
export type { TestPhaseResult } from './types';

export interface TestFeedbackData {
  venueId: string;
  venueName: string;
  predictedScore: number;
  actualRating: number;
  venueRating?: number;
  aiAccuracyRating?: number;
  wouldRecommend?: boolean;
}

export interface AILearningTestResults {
  phases: TestPhaseResult[];
  overallSuccess: boolean;
  totalDuration: number;
  summary: {
    entriesCreated: number;
    entriesVerified: number;
    vectorsUpdated: boolean;
    insightsGenerated: boolean;
    accuracyImprovement: string;
  };
}

// Generate random mock feedback data
export const createMockFeedbackData = (): TestFeedbackData => {
  const testVenues = [
    { id: 'test-venue-1', name: 'Test Italian Bistro' },
    { id: 'test-venue-2', name: 'Test Sushi Bar' },
    { id: 'test-venue-3', name: 'Test Steakhouse' },
  ];
  
  const venue = testVenues[Math.floor(Math.random() * testVenues.length)];
  
  return {
    venueId: venue.id,
    venueName: venue.name,
    predictedScore: Math.floor(Math.random() * 45) + 50, // 50-95
    actualRating: Math.floor(Math.random() * 5) + 1, // 1-5
    venueRating: Math.floor(Math.random() * 5) + 1,
    aiAccuracyRating: Math.floor(Math.random() * 5) + 1,
    wouldRecommend: Math.random() > 0.3,
  };
};

// Generate multiple feedback entries
export const createMultipleFeedbackEntries = (count: number): TestFeedbackData[] => {
  return Array.from({ length: count }, () => createMockFeedbackData());
};

// Run full AI learning test pipeline
export const runAILearningTest = async (userId: string): Promise<AILearningTestResults> => {
  const phases: TestPhaseResult[] = [];
  const startTime = Date.now();
  let entriesCreated = 0;
  let entriesVerified = 0;
  let vectorsUpdated = false;
  let insightsGenerated = false;
  let accuracyBefore = 0;
  let accuracyAfter = 0;

  // Phase 1: Setup - Check current state
  const phase1Start = Date.now();
  try {
    const existingData = await getUserLearningData(userId);
    const existingVectors = await getUserPreferenceVectors(userId);
    accuracyBefore = existingVectors?.ai_accuracy ?? 0;
    
    phases.push({
      phase: 'Setup',
      success: true,
      message: `User authenticated. ${existingData.length} existing entries, accuracy: ${(accuracyBefore * 100).toFixed(1)}%`,
      duration: Date.now() - phase1Start,
      data: { existingEntries: existingData.length, currentAccuracy: accuracyBefore }
    });
  } catch (error) {
    phases.push({
      phase: 'Setup',
      success: false,
      message: `Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - phase1Start
    });
  }

  // Phase 2: Create test feedback data
  const phase2Start = Date.now();
  const testFeedback = createMultipleFeedbackEntries(3);
  phases.push({
    phase: 'Create Test Data',
    success: true,
    message: `Generated ${testFeedback.length} mock feedback entries`,
    duration: Date.now() - phase2Start,
    data: testFeedback
  });

  // Phase 3: Submit feedback to learning system
  const phase3Start = Date.now();
  const learningResults = [];
  try {
    for (const feedback of testFeedback) {
      const result = await learnFromFeedback({
        userId,
        venueId: feedback.venueId,
        predictedScore: feedback.predictedScore,
        actualRating: feedback.actualRating,
        venueRating: feedback.venueRating,
        aiAccuracyRating: feedback.aiAccuracyRating,
        wouldRecommend: feedback.wouldRecommend,
        contextData: {
          testRun: true,
          timestamp: new Date().toISOString(),
          venueName: feedback.venueName
        }
      });
      if (result) {
        learningResults.push(result);
        entriesCreated++;
      }
    }
    
    phases.push({
      phase: 'Submit Feedback',
      success: entriesCreated > 0,
      message: `Successfully submitted ${entriesCreated}/${testFeedback.length} feedback entries`,
      duration: Date.now() - phase3Start,
      data: learningResults
    });
  } catch (error) {
    phases.push({
      phase: 'Submit Feedback',
      success: false,
      message: `Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - phase3Start
    });
  }

  // Phase 4: Verify learning data was stored
  const phase4Start = Date.now();
  try {
    const learningData = await getUserLearningData(userId);
    const recentEntries = learningData.filter(entry => {
      const entryTime = new Date(entry.created_at).getTime();
      return entryTime > startTime;
    });
    entriesVerified = recentEntries.length;
    
    phases.push({
      phase: 'Verify Learning Data',
      success: entriesVerified > 0,
      message: `Found ${entriesVerified} new entries in ai_learning_data`,
      duration: Date.now() - phase4Start,
      data: recentEntries
    });
  } catch (error) {
    phases.push({
      phase: 'Verify Learning Data',
      success: false,
      message: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - phase4Start
    });
  }

  // Phase 5: Verify preference vectors updated
  const phase5Start = Date.now();
  try {
    const vectors = await getUserPreferenceVectors(userId);
    if (vectors) {
      accuracyAfter = vectors.ai_accuracy ?? 0;
      vectorsUpdated = vectors.total_ratings !== null && vectors.total_ratings > 0;
      
      phases.push({
        phase: 'Verify Preference Vectors',
        success: true,
        message: `Vectors updated. Total ratings: ${vectors.total_ratings}, Accuracy: ${(accuracyAfter * 100).toFixed(1)}%`,
        duration: Date.now() - phase5Start,
        data: {
          featureWeights: vectors.feature_weights,
          totalRatings: vectors.total_ratings,
          accuracy: accuracyAfter
        }
      });
    } else {
      phases.push({
        phase: 'Verify Preference Vectors',
        success: false,
        message: 'No preference vectors found',
        duration: Date.now() - phase5Start
      });
    }
  } catch (error) {
    phases.push({
      phase: 'Verify Preference Vectors',
      success: false,
      message: `Vector check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - phase5Start
    });
  }

  // Phase 6: Test AI insights generation
  const phase6Start = Date.now();
  try {
    const insights = await getAIInsights(userId);
    insightsGenerated = insights !== null;
    
    phases.push({
      phase: 'AI Insights',
      success: insightsGenerated,
      message: insightsGenerated 
        ? `Generated insights: ${insights.textInsights.length} tips, ${(parseFloat(insights.aiAccuracy) * 100).toFixed(1)}% accuracy`
        : 'No insights generated',
      duration: Date.now() - phase6Start,
      data: insights
    });
  } catch (error) {
    phases.push({
      phase: 'AI Insights',
      success: false,
      message: `Insights failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - phase6Start
    });
  }

  // Phase 7: Validation
  const phase7Start = Date.now();
  const overallSuccess = phases.filter(p => p.success).length >= 5;
  const accuracyChange = accuracyAfter - accuracyBefore;
  
  phases.push({
    phase: 'Validation',
    success: overallSuccess,
    message: overallSuccess 
      ? `Pipeline validated. Accuracy change: ${accuracyChange >= 0 ? '+' : ''}${(accuracyChange * 100).toFixed(2)}%`
      : 'Some phases failed - check individual results',
    duration: Date.now() - phase7Start
  });

  return {
    phases,
    overallSuccess,
    totalDuration: Date.now() - startTime,
    summary: {
      entriesCreated,
      entriesVerified,
      vectorsUpdated,
      insightsGenerated,
      accuracyImprovement: `${accuracyChange >= 0 ? '+' : ''}${(accuracyChange * 100).toFixed(2)}%`
    }
  };
};

// Test single feedback submission
export const testSingleFeedback = async (userId: string): Promise<TestPhaseResult> => {
  const startTime = Date.now();
  const feedback = createMockFeedbackData();
  
  try {
    const result = await learnFromFeedback({
      userId,
      venueId: feedback.venueId,
      predictedScore: feedback.predictedScore,
      actualRating: feedback.actualRating,
      venueRating: feedback.venueRating,
      aiAccuracyRating: feedback.aiAccuracyRating,
      wouldRecommend: feedback.wouldRecommend,
      contextData: { testRun: true, venueName: feedback.venueName }
    });
    
    return {
      phase: 'Single Feedback Test',
      success: result !== null,
      message: result 
        ? `Success! AI accuracy: ${result.aiAccuracy}, Error: ${result.predictionError}`
        : 'No result returned',
      duration: Date.now() - startTime,
      data: { feedback, result }
    };
  } catch (error) {
    return {
      phase: 'Single Feedback Test',
      success: false,
      message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration: Date.now() - startTime
    };
  }
};
