import { User as SupabaseUser } from '@supabase/supabase-js';

// Extend Supabase User with our custom properties
export interface User extends SupabaseUser {
  name?: string;
  avatar_url?: string;
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
  // React Native compatibility properties
  lastActive?: string;
  selected?: boolean;
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
  photos?: Array<{
    url: string;
    thumbnail?: string;
    width: number;
    height: number;
    attribution?: string;
    isGooglePhoto: boolean;
  }>;
  tags?: string[];
  is_active?: boolean;
  google_place_id?: string;
  opening_hours?: any[];
  created_at?: string;
  updated_at?: string;
  
  // UI-only computed properties for compatibility with React Native code
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
  
  // Additional missing properties from React Native code
  cuisine?: string;
  averageRating?: number;
  reviewCount?: number;
  features?: string[];
  estimatedWaitTime?: number | string;
  openNow?: boolean;
  discounts?: Array<{
    id: number;
    title: string;
    description: string;
    code: string;
    percentage: number;
  }>;
  
  // VenueDetail specific properties
  email?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
  };
  hours?: {
    [key: string]: {
      open: string;
      close: string;
      closed: boolean;
    };
  };
  menu?: {
    categories: string[];
    highlights: string[];
  };
  reviews?: Array<{
    id: number;
    author: string;
    rating: number;
    text: string;
    date: string;
  }>;
  capacity?: number;
  averageStay?: number;
  reservationRequired?: boolean;
  parking?: boolean;
  accessibility?: boolean;
  petFriendly?: boolean;
  outdoorSeating?: boolean;
  liveMusic?: boolean;
  happyHour?: {
    start: string;
    end: string;
    days: string[];
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  longDescription?: string;
  amenities?: string[];
  area?: string;
  areaId?: number;
  priceLevel?: number;
  cuisineType?: string;
  vibeType?: string;
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
  venueName?: string;
  venueAddress?: string;
  estimatedCost?: string;
  duration?: string;
  hasMultipleOptions?: boolean;
  specialRequests?: string;
}

export interface UserPreferences {
  id?: string;
  user_id?: string;
  preferred_cuisines?: string[];
  preferred_vibes?: string[];
  preferred_price_range?: string[];
  max_distance?: number;
  preferred_times?: string[];
  dietary_restrictions?: string[];
  
  // React Native compatibility properties
  cuisines?: string[];
  vibes?: string[];
  priceRange?: number[];
  distance?: number;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  created_at: string;
  updated_at: string;
}

// Additional interfaces for React Native compatibility
export interface Area {
  id: number;
  name: string;
  icon: string;
  description: string;
  distance?: string;
  venueCount?: number;
  priceRange?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  radius?: number;
  averagePrice?: number;
  popularCuisines?: string[];
  atmosphere?: string[];
}

export interface SearchFilters {
  area?: Area;
  cuisines?: string[];
  vibes?: string[];
  priceRange?: number[];
  openNow?: boolean;
  friends?: Friend[];
}

export interface MockUser {
  id: number;
  name: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastActive: Date | string;
  preferences: UserPreferences;
  friends: number[];
  favorites: number[];
  visits?: Array<{
    venueId: number;
    date: string;
    rating: number;
  }>;
}

// Type guards for runtime type checking
export const isVenue = (obj: any): obj is Venue => {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
};

export const isFriend = (obj: any): obj is Friend => {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
};

export const isArea = (obj: any): obj is Area => {
  return obj && typeof obj.id === 'number' && typeof obj.name === 'string';
};