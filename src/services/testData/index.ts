// Consolidated test data services

// Re-export types
export type { TestPhaseResult, TestUser, TestUserPreferences } from './types';

// Re-export from friendshipService
export { createTestFriendships, createOneMockFriend } from './friendshipService';

// Re-export from smartPlannerTestUtils (includes merged preferenceService)
export { 
  createTestUserPreferences,
  updateJennePreferences,
  updateUserPreferences,
  applyTestScenario,
  resetToDefaultPreferences,
  getTestUsers,
  setupMainTestUsers,
  TEST_SCENARIOS
} from './smartPlannerTestUtils';

// Re-export from userPreferencesSetup
export { 
  TEST_USERS,
  createDiverseTestUsers, 
  getTestUserInfo 
} from './userPreferencesSetup';

// Re-export from venueService (consolidated - uses enhanced 25+ venues dataset)
export { createEnhancedTestVenues, createEnhancedTestVenues as createTestVenues } from './venueService';

// Setup function for test environment
export const setupTestEnvironment = async (currentUserId: string) => {
  const { createTestFriendships } = await import('./friendshipService');
  const { createTestUserPreferences } = await import('./smartPlannerTestUtils');
  const { createEnhancedTestVenues } = await import('./venueService');
  
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
