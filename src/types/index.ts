
export interface User {
  id: string;
  email: string;
  profile?: {
    name?: string;
    avatar_url?: string;
  };
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
  friends?: Friend[];
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  friendship_status?: 'pending' | 'accepted' | 'declined' | 'blocked';
  friendship_id?: string;
  isInvited?: boolean;
  // Additional properties for UI display
  status?: 'online' | 'offline';
  lastSeen?: string;
  mutualFriends?: number;
  joinedDate?: string;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  cuisine_type?: string;
  price_range?: string;
  rating?: number;
  image_url?: string;
  tags?: string[];
  is_active?: boolean;
  google_place_id?: string;
  opening_hours?: any[];
  created_at?: string;
  updated_at?: string;
  // Additional properties for UI display
  vibe?: string;
  distance?: string;
  priceLevel?: number;
  isOpen?: boolean;
  openingHours?: string[];
  features?: string[];
  matchScore?: number;
  discount?: string;
  location?: string;
  image?: string;
  priceRange?: string;
  placeId?: string;
}

export interface DateInvitation {
  id: string;
  sender_id: string;
  recipient_id: string;
  venue_id?: string;
  title: string;
  message?: string;
  proposed_date?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  created_at: string;
  sender?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
  venue?: Venue;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_cuisines?: string[];
  preferred_vibes?: string[];
  preferred_price_range?: string[];
  max_distance?: number;
  preferred_times?: string[];
  dietary_restrictions?: string[];
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  created_at: string;
  updated_at: string;
}
