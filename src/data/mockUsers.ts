
export interface MockUser {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
  profile?: {
    name?: string;
    email?: string;
    avatar_url?: string;
  };
  friends?: Array<{
    id: string;
    name: string;
    avatar: string;
    isInvited: boolean;
  }>;
}

export const mockUser: MockUser = {
  id: 'local-user-123',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  profile: {
    name: 'Test User',
    email: 'test@example.com',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
  },
  friends: [
    { id: '1', name: 'Sarah Johnson', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face', isInvited: false },
    { id: '2', name: 'Mike Chen', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', isInvited: false },
    { id: '3', name: 'Emma Wilson', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', isInvited: false }
  ]
};
