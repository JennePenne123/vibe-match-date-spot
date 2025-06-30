
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Friend {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  friendship_status?: 'pending' | 'accepted' | 'declined' | 'blocked';
  friendship_id?: string;
}

export const useFriends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFriends = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get accepted friendships where user is either the sender or recipient
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          user_id,
          friend_id,
          user:profiles!user_id(id, name, email, avatar_url),
          friend:profiles!friend_id(id, name, email, avatar_url)
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error fetching friends:', error);
        return;
      }

      // Transform the data to get the friend's profile (not the current user's)
      const friendsList = data?.map(friendship => {
        const isCurrentUserSender = friendship.user_id === user.id;
        const friendProfile = isCurrentUserSender ? friendship.friend : friendship.user;
        
        return {
          ...friendProfile,
          friendship_status: friendship.status,
          friendship_id: friendship.id
        };
      }) || [];

      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (friendEmail: string) => {
    if (!user) return false;

    try {
      // First, find the user by email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', friendEmail)
        .single();

      if (profileError || !profiles) {
        console.error('User not found:', profileError);
        return false;
      }

      // Check if friendship already exists
      const { data: existing } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${profiles.id}),and(user_id.eq.${profiles.id},friend_id.eq.${user.id})`)
        .single();

      if (existing) {
        console.log('Friendship already exists');
        return false;
      }

      // Create friendship request
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: user.id,
          friend_id: profiles.id,
          status: 'pending'
        });

      if (error) {
        console.error('Error sending friend request:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending friend request:', error);
      return false;
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) {
        console.error('Error removing friend:', error);
        return false;
      }

      // Update local state
      setFriends(prev => prev.filter(friend => friend.friendship_id !== friendshipId));
      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  return {
    friends,
    loading,
    sendFriendRequest,
    removeFriend,
    fetchFriends
  };
};
