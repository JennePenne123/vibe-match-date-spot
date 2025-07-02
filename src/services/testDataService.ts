
import { supabase } from '@/integrations/supabase/client';

export interface TestUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export const TEST_USERS: TestUser[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Sarah Johnson',
    email: 'sarah@test.com',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Mike Chen',
    email: 'mike@test.com',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Emma Wilson',
    email: 'emma@test.com',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
  }
];

export const createTestFriendships = async (currentUserId: string) => {
  try {
    console.log('Creating test friendships for user:', currentUserId);
    
    const friendships = TEST_USERS.map(testUser => ({
      user_id: currentUserId,
      friend_id: testUser.id,
      status: 'accepted'
    }));

    const { error } = await supabase
      .from('friendships')
      .upsert(friendships, { onConflict: 'user_id,friend_id' });

    if (error) {
      console.error('Error creating test friendships:', error);
      throw error;
    }

    console.log('Test friendships created successfully');
    return true;
  } catch (error) {
    console.error('Error in createTestFriendships:', error);
    throw error;
  }
};

export const createTestUserPreferences = async (currentUserId: string) => {
  try {
    console.log('Creating test preferences for user:', currentUserId);
    
    const userPreferences = {
      user_id: currentUserId,
      preferred_cuisines: ['Italian', 'Japanese'],
      preferred_price_range: ['$$', '$$$'],
      preferred_times: ['evening', 'night'],
      preferred_vibes: ['romantic', 'upscale'],
      max_distance: 15,
      dietary_restrictions: []
    };

    const { error } = await supabase
      .from('user_preferences')
      .upsert(userPreferences, { onConflict: 'user_id' });

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

export const createTestVenues = async () => {
  try {
    console.log('Creating test venues...');
    
    const venues = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'Romantic Rooftop',
        address: '123 Downtown Ave',
        cuisine_type: 'Italian',
        price_range: '$$',
        rating: 4.5,
        tags: ['romantic', 'rooftop', 'intimate'],
        description: 'Beautiful rooftop dining with city views',
        is_active: true
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'Cozy Coffee Corner',
        address: '456 Main St',
        cuisine_type: 'Cafe',
        price_range: '$',
        rating: 4.2,
        tags: ['casual', 'cozy', 'coffee'],
        description: 'Perfect spot for casual dates and conversations',
        is_active: true
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        name: 'Upscale Steakhouse',
        address: '789 Elite Blvd',
        cuisine_type: 'American',
        price_range: '$$$',
        rating: 4.8,
        tags: ['upscale', 'formal', 'steakhouse'],
        description: 'Premium dining experience for special occasions',
        is_active: true
      },
      {
        id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
        name: 'Trendy Sushi Bar',
        address: '321 Hip St',
        cuisine_type: 'Japanese',
        price_range: '$$',
        rating: 4.3,
        tags: ['trendy', 'modern', 'sushi'],
        description: 'Modern sushi bar with creative rolls',
        is_active: true
      },
      {
        id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        name: 'Family Pizza Place',
        address: '654 Family Ave',
        cuisine_type: 'Italian',
        price_range: '$',
        rating: 4.0,
        tags: ['casual', 'family', 'pizza'],
        description: 'Great for relaxed, fun dates',
        is_active: true
      }
    ];

    const { error } = await supabase
      .from('venues')
      .upsert(venues, { onConflict: 'id' });

    if (error) {
      console.error('Error creating test venues:', error);
      throw error;
    }

    console.log('Test venues created successfully');
    return true;
  } catch (error) {
    console.error('Error in createTestVenues:', error);
    throw error;
  }
};

export const createOneMockFriend = async (currentUserId: string) => {
  try {
    console.log('Creating one mock friend for user:', currentUserId);
    
    // First create the test user profile if it doesn't exist
    const testUser = TEST_USERS[0]; // Use Sarah Johnson
    console.log('Creating profile for:', testUser.name, testUser.id);
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        avatar_url: testUser.avatar_url
      }, { onConflict: 'id' })
      .select();

    if (profileError) {
      console.error('Error creating test user profile:', profileError);
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }
    
    console.log('Profile created/updated:', profileData);

    // Check if friendship already exists
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(user_id.eq.${currentUserId},friend_id.eq.${testUser.id}),and(user_id.eq.${testUser.id},friend_id.eq.${currentUserId})`)
      .single();

    if (existingFriendship) {
      console.log('Friendship already exists:', existingFriendship);
      return true;
    }

    // Create the friendship
    console.log('Creating friendship between:', currentUserId, 'and', testUser.id);
    const { data: friendshipData, error: friendshipError } = await supabase
      .from('friendships')
      .insert({
        user_id: currentUserId,
        friend_id: testUser.id,
        status: 'accepted'
      })
      .select();

    if (friendshipError) {
      console.error('Error creating test friendship:', friendshipError);
      throw new Error(`Friendship creation failed: ${friendshipError.message}`);
    }
    
    console.log('Friendship created:', friendshipData);
    console.log('Mock friend created successfully');
    return true;
  } catch (error) {
    console.error('Error in createOneMockFriend:', error);
    throw error;
  }
};

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
