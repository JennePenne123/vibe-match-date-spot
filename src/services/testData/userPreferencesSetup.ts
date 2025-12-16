import { supabase } from '@/integrations/supabase/client';
import type { TestUser } from './types';

// Re-export for backward compatibility
export type { TestUser } from './types';

// Predefined test users (consolidated from constants.ts)
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

// Create diverse test users with different preference profiles for comprehensive testing
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

    // Create profiles and preferences for each test user
    for (const user of testUsers) {
      console.log(`Creating test user: ${user.name}...`);
      
      // Create profile
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

      // Create preferences using the security definer function
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
