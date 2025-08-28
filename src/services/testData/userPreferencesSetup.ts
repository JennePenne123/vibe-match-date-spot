import { supabase } from '@/integrations/supabase/client';

// Create diverse test users with different preference profiles for comprehensive testing
export const createDiverseTestUsers = async () => {
  try {
    console.log('🧪 Creating diverse test users with varied preferences...');
    
    const testUsers = [
      {
        id: '11111111-1111-1111-1111-111111111111',
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
        id: '22222222-2222-2222-2222-222222222222',
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
        id: '33333333-3333-3333-3333-333333333333',
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
        id: '44444444-4444-4444-4444-444444444444',
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
        id: '55555555-5555-5555-5555-555555555555',
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
        id: '66666666-6666-6666-6666-666666666666',
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
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar_url: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face`
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
    { id: '11111111-1111-1111-1111-111111111111', name: 'Romantic Rose', type: 'Romantic dates, Italian/French cuisine' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Casual Casey', type: 'Casual dining, American/Mexican food' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Trendy Taylor', type: 'Trendy spots, Asian cuisine' },
    { id: '44444444-4444-4444-4444-444444444444', name: 'Healthy Hannah', type: 'Healthy eating, vegetarian/vegan' },
    { id: '55555555-5555-5555-5555-555555555555', name: 'Luxury Louis', type: 'High-end dining, steakhouses' },
    { id: '66666666-6666-6666-6666-666666666666', name: 'Adventure Alex', type: 'Adventurous flavors, spicy food' }
  ];
};