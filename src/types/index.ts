
export interface User {
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
  friends?: Friend[];
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  isInvited?: boolean;
  status?: 'online' | 'offline';
  lastSeen?: string;
  mutualFriends?: number;
  joinedDate?: string;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  distance: string;
  priceRange: string;
  location: string;
  cuisineType: string;
  vibe: string;
  matchScore: number;
  tags: string[];
  discount?: string;
  placeId?: string;
  phone?: string;
  website?: string;
  openingHours?: string[];
  isOpen?: boolean;
}

export interface DateInvite {
  id: number;
  friendName: string;
  friendAvatar: string;
  dateType: string;
  location: string;
  time: string;
  message: string;
  status: string;
  venueName: string;
  venueAddress: string;
  estimatedCost: string;
  duration: string;
  specialNotes: string;
  venueImage: string;
}
