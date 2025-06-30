
import { supabase } from '@/integrations/supabase/client';

export const inviteFriendById = async (userId: string, friendId: string) => {
  try {
    // Create friendship invitation
    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending'
      });

    if (error) {
      console.error('Invite friend error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Invite friend error:', error);
    throw error;
  }
};
