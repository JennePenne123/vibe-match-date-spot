import { createTestFriendships, createOneMockFriend } from './friendshipService';
import { createTestUserPreferences } from './preferenceService';
import { createTestVenues } from './venueService';

export const setupTestEnvironment = async (currentUserId: string) => {
  try {
    console.log('Setting up test environment...');
    
    await createTestVenues();
    await createTestFriendships(currentUserId);
    await createTestUserPreferences(currentUserId);
    
    console.log('Test environment setup complete!');
    return true;
  } catch (error) {
    console.error('Error setting up test environment:', error);
    throw error;
  }
};

// Re-export all functions for backward compatibility
export { createTestFriendships, createOneMockFriend } from './friendshipService';
export { createTestUserPreferences } from './preferenceService';
export { createTestVenues } from './venueService';
export { TEST_USERS } from './constants';
export type { TestUser } from './constants';