
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  // Remove profile and user_metadata - we'll get this from the profiles table
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  friendship_status?: 'pending' | 'accepted' | 'declined' | 'blocked';
  friendship_id?: string;
  // UI-only properties for compatibility
  status?: 'online' | 'offline';
  lastSeen?: string;
  mutualFriends?: number;
  joinedDate?: string;
  isInvited?: boolean;
}

export interface Venue {
  id: string;
  name: string;
  description?: string;
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
  // UI-only computed properties for compatibility
  image?: string;
  location?: string;
  distance?: string;
  vibe?: string;
  matchScore?: number;
  discount?: string;
  isOpen?: boolean;
  openingHours?: string[];
  placeId?: string;
  priceRange?: string;
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
  sender?: Profile;
  venue?: Venue;
  // UI compatibility properties
  friendName?: string;
  friendAvatar?: string;
  dateType?: string;
  location?: string;
  time?: string;
  description?: string;
  image?: string;
  venueCount?: number;
  isGroupDate?: boolean;
  participants?: string[];
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
