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