// Consolidated test data services

// Types
export type { TestPhaseResult, TestUser, TestUserPreferences } from './types';

// Friendships
export { createTestFriendships, createOneMockFriend } from './friendships';

// Preferences (consolidated from userPreferencesSetup + smartPlannerTestUtils)
export { 
  TEST_USERS,
  TEST_SCENARIOS,
  createDiverseTestUsers,
  getTestUserInfo,
  createTestUserPreferences,
  updateUserPreferences,
  applyTestScenario,
  resetToDefaultPreferences,
  getTestUsers,
  setupMainTestUsers,
  updateJennePreferences
} from './preferences';

// Gamification (consolidated from gamificationTestData + gamificationTestRunner)
export { 
  createGamificationTestData,
  createComprehensiveTestData,
  triggerCheckCompletedDates,
  triggerCalculateRewards,
  initializeUserPoints,
  runFullGamificationTest
} from './gamification';
export type { TestRunResults } from './gamification';

// AI Learning
export { 
  runAILearningTest,
  testSingleFeedback,
  createMockFeedbackData,
  createMultipleFeedbackEntries
} from './aiLearning';
export type { AILearningTestResults, TestFeedbackData } from './aiLearning';

// Venues
export { createEnhancedTestVenues, createTestVenues } from './venues';

// Setup function for test environment
export const setupTestEnvironment = async (currentUserId: string) => {
  const { createTestFriendships } = await import('./friendships');
  const { createTestUserPreferences } = await import('./preferences');
  const { createEnhancedTestVenues } = await import('./venues');
  
  try {
    console.log('Setting up test environment...');
    
    await createEnhancedTestVenues();
    await createTestFriendships(currentUserId);
    await createTestUserPreferences(currentUserId);
    
    console.log('Test environment setup complete!');
    return true;
  } catch (error) {
    console.error('Error setting up test environment:', error);
    throw error;
  }
};