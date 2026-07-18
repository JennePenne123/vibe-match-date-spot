
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Friend } from '@/types';

export const useFriends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFriends = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get accepted friendships where user is either the sender or recipient
      const { data, error } = await supabase
        .from('friendships')
        .select('id, status, user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .in('status', ['accepted', 'pending']);

      if (error) {
        console.error('Error fetching friends:', error);
        return;
      }

      // Collect the other-user ids and fetch their public profile info separately.
      // This avoids relying on PostgREST FK embedding for the profiles_safe view,
      // which can silently drop rows if the schema cache lost the relationship.
      const otherIds = Array.from(new Set(
        (data || []).map(f => (f.user_id === user.id ? f.friend_id : f.user_id))
      ));

      let profilesById = new Map<string, { id: string; name: string | null; avatar_url: string | null }>();
      if (otherIds.length > 0) {
        const { data: profs, error: profErr } = await supabase
          .from('profiles_safe')
          .select('id, name, avatar_url')
          .in('id', otherIds);
        if (profErr) {
          console.error('Error fetching friend profiles:', profErr);
        } else {
          profs?.forEach(p => profilesById.set(p.id, p as any));
        }
      }

      // Transform the data to get the friend's profile and deduplicate
      const friendsMap = new Map<string, Friend>();
      const requestsMap = new Map<string, Friend>();
      const outgoingMap = new Map<string, Friend>();

      data?.forEach(friendship => {
        const isCurrentUserSender = friendship.user_id === user.id;
        const otherId = isCurrentUserSender ? friendship.friend_id : friendship.user_id;
        const profile = profilesById.get(otherId) || { id: otherId, name: 'Freund', avatar_url: null };
        if (!profile.id) return;

        const entry: Friend = {
          id: profile.id,
          name: profile.name,
          email: '', // Email is no longer fetched for friend profiles (privacy)
          avatar_url: profile.avatar_url,
          friendship_status: friendship.status as 'pending' | 'accepted' | 'declined' | 'blocked',
          friendship_id: friendship.id,
          // Add some default UI properties
          status: 'offline',
          lastSeen: 'Last seen recently',
          mutualFriends: 0,
          joinedDate: '1 month ago',
          isInvited: false,
        };

        if (friendship.status === 'accepted') {
          if (!friendsMap.has(profile.id)) friendsMap.set(profile.id, entry);
        } else if (friendship.status === 'pending' && !isCurrentUserSender) {
          // Only incoming requests (where the current user is the recipient)
          if (!requestsMap.has(profile.id)) requestsMap.set(profile.id, entry);
        } else if (friendship.status === 'pending' && isCurrentUserSender) {
          // Outgoing requests waiting for the recipient to accept
          if (!outgoingMap.has(profile.id)) outgoingMap.set(profile.id, entry);
        }
      });

      setFriends(Array.from(friendsMap.values()));
      setPendingRequests(Array.from(requestsMap.values()));
      setOutgoingRequests(Array.from(outgoingMap.values()));
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
      setOutgoingRequests(prev => prev.filter(req => req.friendship_id !== friendshipId));
      setPendingRequests(prev => prev.filter(req => req.friendship_id !== friendshipId));
      return true;
    } catch (error) {
      console.error('Error removing friend:', error);
      return false;
    }
  };

  const cancelFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) {
        console.error('Error cancelling friend request:', error);
        return false;
      }

      setOutgoingRequests(prev => prev.filter(req => req.friendship_id !== friendshipId));
      return true;
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      return false;
    }
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendshipId);

      if (error) {
        console.error('Error accepting friend request:', error);
        return false;
      }

      await fetchFriends();
      return true;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      return false;
    }
  };

  const declineFriendRequest = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('id', friendshipId);

      if (error) {
        console.error('Error declining friend request:', error);
        return false;
      }

      setPendingRequests(prev => prev.filter(req => req.friendship_id !== friendshipId));
      return true;
    } catch (error) {
      console.error('Error declining friend request:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  return {
    friends,
    pendingRequests,
    outgoingRequests,
    loading,
    sendFriendRequest,
    removeFriend,
    cancelFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    fetchFriends
  };
};
