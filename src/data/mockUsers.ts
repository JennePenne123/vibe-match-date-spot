
import { User, Friend } from '@/types';

export const mockFriends: Friend[] = [
  { 
    id: '1', 
    name: 'Sarah Johnson', 
    email: 'sarah@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    isInvited: false,
    status: 'online',
    lastSeen: 'Active now',
    mutualFriends: 3,
    joinedDate: '2 months ago'
  },
  { 
    id: '2', 
    name: 'Mike Chen', 
    email: 'mike@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    isInvited: false,
    status: 'offline',
    lastSeen: '2 hours ago',
    mutualFriends: 5,
    joinedDate: '3 months ago'
  },
  { 
    id: '3', 
    name: 'Emma Wilson',
    email: 'emma@example.com', 
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    isInvited: false,
    status: 'online',
    lastSeen: 'Active now',
    mutualFriends: 2,
    joinedDate: '1 month ago'
  },
  { 
    id: '4', 
    name: 'David Rodriguez',
    email: 'david@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isInvited: false,
    status: 'offline',
    lastSeen: '1 day ago',
    mutualFriends: 4,
    joinedDate: '4 months ago'
  },
  { 
    id: '5', 
    name: 'Jessica Lee',
    email: 'jessica@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    isInvited: false,
    status: 'online',
    lastSeen: 'Active now',
    mutualFriends: 1,
    joinedDate: '2 weeks ago'
  }
];

export const mockUser: User = {
  id: 'local-user-123',
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
};
