
// Simplified types for the application UI
export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
}

export interface AppVenue {
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
  
  // UI-specific properties
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
