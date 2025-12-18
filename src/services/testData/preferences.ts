import { supabase } from '@/integrations/supabase/client';
import type { TestUser, TestUserPreferences } from './types';

// Predefined test users
export const TEST_USERS: TestUser[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Sarah Johnson',
    email: 'sarah@test.com',
    avatar_url: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=ffc0cb&color=fff&size=128&bold=true'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Mike Chen',
    email: 'mike@test.com',
    avatar_url: 'https://ui-avatars.com/api/?name=Mike+Chen&background=ffc0cb&color=fff&size=128&bold=true'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Emma Wilson',
    email: 'emma@test.com',
    avatar_url: 'https://ui-avatars.com/api/?name=Emma+Wilson&background=ffc0cb&color=fff&size=128&bold=true'
  }
];

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

// Update user preferences
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

// Apply a test scenario to two users
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

// Reset user preferences to defaults
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

// Get all test users from database
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
    
    await applyTestScenario('mixed', janWiechmann.id, jennePenne.id);
    
    console.log('✅ Main test users setup complete');
    return { janWiechmann, jennePenne, janW };
  } catch (error) {
    console.error('❌ Error setting up main test users:', error);
    throw error;
  }
};

// Update Jenne Penne's preferences for testing
export const updateJennePreferences = async () => {
  try {
    console.log('Updating Jenne Penne preferences for Smart Planner testing');
    
    const { error } = await supabase.rpc('setup_test_user_preferences', {
      target_user_id: 'dbfe64ff-d75a-4032-af21-6c31bfdc4215',
      cuisines: ['Italian', 'Japanese', 'Mexican'],
      price_range: ['$$', '$$$'],
      times: ['evening', 'night'],
      vibes: ['romantic', 'casual', 'lively'],
      max_dist: 18,
      dietary: []
    });

    if (error) {
      console.error('Error updating Jenne preferences:', error);
      throw error;
    }

    console.log('Jenne preferences updated successfully');
    return true;
  } catch (error) {
    console.error('Error in updateJennePreferences:', error);
    throw error;
  }
};

// Create test preferences for a specific user
export const createTestUserPreferences = async (currentUserId: string) => {
  try {
    console.log('Creating test preferences for user:', currentUserId);
    
    const { error } = await supabase.rpc('setup_test_user_preferences', {
      target_user_id: currentUserId,
      cuisines: ['Italian', 'Japanese'],
      price_range: ['$$', '$$$'],
      times: ['evening', 'night'],
      vibes: ['romantic', 'upscale'],
      max_dist: 15,
      dietary: []
    });

    if (error) {
      console.error('Error creating user preferences:', error);
      throw error;
    }

    console.log('User preferences created successfully');
    return true;
  } catch (error) {
    console.error('Error in createTestUserPreferences:', error);
    throw error;
  }
};

// Create diverse test users with different preference profiles
export const createDiverseTestUsers = async () => {
  try {
    console.log('🧪 Creating diverse test users with varied preferences...');
    
    const testUsers = [
      {
        id: '11111111-2222-3333-4444-555555555551',
        email: 'romantic@example.com',
        name: 'Romantic Rose',
        preferences: {
          preferred_cuisines: ['Italian', 'French'],
          preferred_vibes: ['romantic', 'intimate', 'candlelit'],
          preferred_times: ['dinner', 'evening'],
          preferred_price_range: ['$$$', '$$$$'],
          max_distance: 20,
          dietary_restrictions: []
        }
      },
      {
        id: '11111111-2222-3333-4444-555555555552',
        email: 'casual@example.com',
        name: 'Casual Casey',
        preferences: {
          preferred_cuisines: ['American', 'Mexican', 'Thai'],
          preferred_vibes: ['casual', 'relaxed', 'friendly'],
          preferred_times: ['lunch', 'brunch'],
          preferred_price_range: ['$', '$$'],
          max_distance: 15,
          dietary_restrictions: []
        }
      },
      {
        id: '11111111-2222-3333-4444-555555555553',
        email: 'trendy@example.com',
        name: 'Trendy Taylor',
        preferences: {
          preferred_cuisines: ['Japanese', 'Fusion', 'Vietnamese'],
          preferred_vibes: ['trendy', 'modern', 'hip', 'stylish'],
          preferred_times: ['dinner', 'lunch'],
          preferred_price_range: ['$$', '$$$'],
          max_distance: 25,
          dietary_restrictions: []
        }
      },
      {
        id: '11111111-2222-3333-4444-555555555554',
        email: 'healthy@example.com',
        name: 'Healthy Hannah',
        preferences: {
          preferred_cuisines: ['Vegetarian', 'Vegan', 'Mediterranean'],
          preferred_vibes: ['healthy', 'organic', 'fresh'],
          preferred_times: ['lunch', 'brunch'],
          preferred_price_range: ['$$', '$$$'],
          max_distance: 10,
          dietary_restrictions: ['vegetarian', 'gluten-free']
        }
      },
      {
        id: '11111111-2222-3333-4444-555555555555',
        email: 'luxury@example.com',
        name: 'Luxury Louis',
        preferences: {
          preferred_cuisines: ['French', 'Steakhouse', 'Seafood'],
          preferred_vibes: ['upscale', 'elegant', 'luxury'],
          preferred_times: ['dinner', 'evening'],
          preferred_price_range: ['$$$$'],
          max_distance: 30,
          dietary_restrictions: []
        }
      },
      {
        id: '11111111-2222-3333-4444-555555555556',
        email: 'adventure@example.com',
        name: 'Adventure Alex',
        preferences: {
          preferred_cuisines: ['Indian', 'Thai', 'Fusion', 'Greek'],
          preferred_vibes: ['spicy', 'authentic', 'innovative'],
          preferred_times: ['lunch', 'dinner'],
          preferred_price_range: ['$$', '$$$'],
          max_distance: 20,
          dietary_restrictions: []
        }
      }
    ];

    for (const user of testUsers) {
      console.log(`Creating test user: ${user.name}...`);
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=ffc0cb&color=fff&size=128&bold=true`
        }, { onConflict: 'id' });

      if (profileError) {
        console.error(`Error creating profile for ${user.name}:`, profileError);
        continue;
      }

      const { error: prefError } = await supabase.rpc('setup_test_user_preferences', {
        target_user_id: user.id,
        cuisines: user.preferences.preferred_cuisines,
        vibes: user.preferences.preferred_vibes,
        times: user.preferences.preferred_times,
        price_range: user.preferences.preferred_price_range,
        max_dist: user.preferences.max_distance,
        dietary: user.preferences.dietary_restrictions
      });

      if (prefError) {
        console.error(`Error creating preferences for ${user.name}:`, prefError);
        continue;
      }

      console.log(`✅ Created test user: ${user.name} with diverse preferences`);
    }

    console.log(`🎉 Successfully created ${testUsers.length} diverse test users`);
    return testUsers;
  } catch (error) {
    console.error('Error creating diverse test users:', error);
    throw error;
  }
};

// Get test user information for collaborative testing
export const getTestUserInfo = () => {
  return [
    { id: '11111111-2222-3333-4444-555555555551', name: 'Romantic Rose', type: 'Romantic dates, Italian/French cuisine' },
    { id: '11111111-2222-3333-4444-555555555552', name: 'Casual Casey', type: 'Casual dining, American/Mexican food' },
    { id: '11111111-2222-3333-4444-555555555553', name: 'Trendy Taylor', type: 'Trendy spots, Asian cuisine' },
    { id: '11111111-2222-3333-4444-555555555554', name: 'Healthy Hannah', type: 'Healthy eating, vegetarian/vegan' },
    { id: '11111111-2222-3333-4444-555555555555', name: 'Luxury Louis', type: 'High-end dining, steakhouses' },
    { id: '11111111-2222-3333-4444-555555555556', name: 'Adventure Alex', type: 'Adventurous flavors, spicy food' }
  ];
};