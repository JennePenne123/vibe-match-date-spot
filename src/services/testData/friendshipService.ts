import { supabase } from '@/integrations/supabase/client';
import { TEST_USERS } from './constants';

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