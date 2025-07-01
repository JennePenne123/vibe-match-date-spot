
import { useState, useEffect } from 'react';
import { Friend } from '@/types';

// Mock friends data
const MOCK_FRIENDS: Friend[] = [
  {
    id: 'friend-1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    avatar_url: null,
    friendship_status: 'accepted',
    friendship_id: 'friendship-1',
    status: 'online',
    lastSeen: 'Online now',
    mutualFriends: 5,
    joinedDate: '2 months ago',
    isInvited: false
  },
  {
    id: 'friend-2',
    name: 'Bob Smith',
    email: 'bob@example.com',
    avatar_url: null,
    friendship_status: 'accepted',
    friendship_id: 'friendship-2',
    status: 'offline',
    lastSeen: '2 hours ago',
    mutualFriends: 3,
    joinedDate: '1 month ago',
    isInvited: false
  },
  {
    id: 'friend-3',
    name: 'Carol Davis',
    email: 'carol@example.com',
    avatar_url: null,
    friendship_status: 'accepted',
    friendship_id: 'friendship-3',
    status: 'online',
    lastSeen: 'Online now',
    mutualFriends: 8,
    joinedDate: '3 months ago',
    isInvited: false
  }
];

export const useMockFriends = () => {
  const [friends, setFriends] = useState<Friend[]>(MOCK_FRIENDS);
  const [loading, setLoading] = useState(false);

  const sendFriendRequest = async (friendEmail: string) => {
    console.log('Mock: Sending friend request to', friendEmail);
    return true;
  };

  const removeFriend = async (friendshipId: string) => {
    console.log('Mock: Removing friend', friendshipId);
    setFriends(prev => prev.filter(friend => friend.friendship_id !== friendshipId));
    return true;
  };

  const fetchFriends = async () => {
    console.log('Mock: Fetching friends');
    // Already have friends loaded
  };

  return {
    friends,
    loading,
    sendFriendRequest,
    removeFriend,
    fetchFriends
  };
};
