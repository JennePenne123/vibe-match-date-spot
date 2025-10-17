import { Friend } from '@/types';
import { AppUser } from '@/types/app';

export const mockFriends: Friend[] = [
  { 
    id: '1', 
    name: 'Sarah Johnson', 
    email: 'sarah@example.com',
    avatar_url: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=ffc0cb&color=fff&size=128&bold=true',
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
    avatar_url: 'https://ui-avatars.com/api/?name=Mike+Chen&background=ffc0cb&color=fff&size=128&bold=true',
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
    avatar_url: 'https://ui-avatars.com/api/?name=Emma+Wilson&background=ffc0cb&color=fff&size=128&bold=true',
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
    avatar_url: 'https://ui-avatars.com/api/?name=David+Rodriguez&background=ffc0cb&color=fff&size=128&bold=true',
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
    avatar_url: 'https://ui-avatars.com/api/?name=Jessica+Lee&background=ffc0cb&color=fff&size=128&bold=true',
    isInvited: false,
    status: 'online',
    lastSeen: 'Active now',
    mutualFriends: 1,
    joinedDate: '2 weeks ago'
  }
];

export const mockUser: AppUser = {
  id: 'local-user-123',
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: 'https://ui-avatars.com/api/?name=Test+User&background=ffc0cb&color=fff&size=128&bold=true'
};
