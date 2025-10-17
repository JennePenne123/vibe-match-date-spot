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
    avatar_url: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=ffc0cb&color=fff&size=128&bold=true'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Mike Chen',
    email: 'mike@test.com',
    avatar_url: 'https://ui-avatars.com/api/?name=Mike+Chen&background=ffc0cb&color=fff&size=128&bold=true'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Emma Wilson',
    email: 'emma@test.com',
    avatar_url: 'https://ui-avatars.com/api/?name=Emma+Wilson&background=ffc0cb&color=fff&size=128&bold=true'
  }
];