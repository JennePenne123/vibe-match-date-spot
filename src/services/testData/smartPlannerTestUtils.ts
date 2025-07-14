import { supabase } from '@/integrations/supabase/client';

export interface TestUserPreferences {
  userId: string;
  preferred_cuisines?: string[];
  preferred_vibes?: string[];
  preferred_times?: string[];
  preferred_price_range?: string[];
  max_distance?: number;
  dietary_restrictions?: string[];
}

// Predefined test scenarios
export const TEST_SCENARIOS = {
  compatible: {
    user1: {
      preferred_cuisines: ['Italian', 'Japanese'],
      preferred_vibes: ['romantic', 'upscale'],
      preferred_times: ['evening', 'night'],
      preferred_price_range: ['$$', '$$$'],
      max_distance: 15,
      dietary_restrictions: []
    },
    user2: {
      preferred_cuisines: ['Italian', 'Mediterranean'],
      preferred_vibes: ['romantic', 'casual'],
      preferred_times: ['evening', 'dinner'],
      preferred_price_range: ['$$', '$$$'],
      max_distance: 18,
      dietary_restrictions: []
    }
  },
  incompatible: {
    user1: {
      preferred_cuisines: ['French', 'Mediterranean'],
      preferred_vibes: ['upscale', 'quiet'],
      preferred_times: ['dinner', 'late night'],
      preferred_price_range: ['$$$', '$$$$'],
      max_distance: 12,
      dietary_restrictions: ['gluten-free']
    },
    user2: {
      preferred_cuisines: ['Mexican', 'BBQ'],
      preferred_vibes: ['lively', 'casual'],
      preferred_times: ['lunch', 'afternoon'],
      preferred_price_range: ['$', '$$'],
      max_distance: 25,
      dietary_restrictions: []
    }
  },
  mixed: {
    user1: {
      preferred_cuisines: ['Italian', 'Japanese'],
      preferred_vibes: ['casual'],
      preferred_times: ['lunch', 'morning'],
      preferred_price_range: ['$$$', '$$', '$$$$', '$'],
      max_distance: 15,
      dietary_restrictions: []
    },
    user2: {
      preferred_cuisines: ['Italian', 'Japanese', 'Mexican'],
      preferred_vibes: ['romantic', 'casual', 'lively'],
      preferred_times: ['evening', 'night'],
      preferred_price_range: ['$$', '$$$'],
      max_distance: 18,
      dietary_restrictions: []
    }
  }
};

export const updateUserPreferences = async (preferences: TestUserPreferences) => {
  try {
    const { error } = await supabase.rpc('setup_test_user_preferences', {
      target_user_id: preferences.userId,
      cuisines: preferences.preferred_cuisines,
      vibes: preferences.preferred_vibes,
      times: preferences.preferred_times,
      price_range: preferences.preferred_price_range,
      max_dist: preferences.max_distance,
      dietary: preferences.dietary_restrictions
    });

    if (error) throw error;
    
    console.log('✅ Test preferences updated for user:', preferences.userId);
    return true;
  } catch (error) {
    console.error('❌ Error updating test preferences:', error);
    throw error;
  }
};

export const applyTestScenario = async (scenario: keyof typeof TEST_SCENARIOS, user1Id: string, user2Id: string) => {
  try {
    const scenarioData = TEST_SCENARIOS[scenario];
    
    await Promise.all([
      updateUserPreferences({ userId: user1Id, ...scenarioData.user1 }),
      updateUserPreferences({ userId: user2Id, ...scenarioData.user2 })
    ]);
    
    console.log(`✅ Applied "${scenario}" test scenario for users:`, { user1Id, user2Id });
    return true;
  } catch (error) {
    console.error('❌ Error applying test scenario:', error);
    throw error;
  }
};

export const resetToDefaultPreferences = async (userId: string) => {
  try {
    const { error } = await supabase.rpc('reset_user_preferences_to_default', {
      target_user_id: userId
    });

    if (error) throw error;
    
    console.log('✅ Reset to default preferences for user:', userId);
    return true;
  } catch (error) {
    console.error('❌ Error resetting preferences:', error);
    throw error;
  }
};

// Helper to get all test users
export const getTestUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Error fetching test users:', error);
    throw error;
  }
};

// Quick setup for the three main test users
export const setupMainTestUsers = async () => {
  try {
    const users = await getTestUsers();
    
    const janWiechmann = users.find(u => u.email === 'info@janwiechmann.de');
    const jennePenne = users.find(u => u.email === 'jennepenne123@gmail.com');
    const janW = users.find(u => u.email === 'janwiechmann@hotmail.com');
    
    if (!janWiechmann || !jennePenne || !janW) {
      throw new Error('Test users not found in database');
    }
    
    // Apply mixed scenario between Jan Wiechmann and Jenne Penne
    await applyTestScenario('mixed', janWiechmann.id, jennePenne.id);
    
    console.log('✅ Main test users setup complete');
    return { janWiechmann, jennePenne, janW };
  } catch (error) {
    console.error('❌ Error setting up main test users:', error);
    throw error;
  }
};