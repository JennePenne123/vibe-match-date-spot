
import { User as SupabaseUser } from '@supabase/supabase-js';
import { AppUser, AppVenue } from '@/types/app';
import { Venue } from '@/types';

// Convert Supabase User to AppUser
export const supabaseUserToAppUser = (user: SupabaseUser | null): AppUser | null => {
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    avatar_url: user.user_metadata?.avatar_url
  };
};

// Convert database Venue to AppVenue with UI properties
export const venueToAppVenue = (venue: Venue): AppVenue => {
  return {
    ...venue,
    // Map database fields to UI fields
    image: venue.image_url,
    location: venue.address,
    distance: '0.5 mi', // Mock distance
    matchScore: Math.floor(Math.random() * 30) + 70, // Mock match score 70-100
    discount: Math.random() > 0.7 ? '15% off appetizers' : undefined, // Random discount
    isOpen: Math.random() > 0.3, // Random open status
    openingHours: venue.opening_hours ? 
      (Array.isArray(venue.opening_hours) ? venue.opening_hours as string[] : ['Mon-Sun: 9:00 AM - 10:00 PM']) : 
      ['Mon-Sun: 9:00 AM - 10:00 PM'],
    placeId: venue.google_place_id,
    priceRange: venue.price_range
  };
};

// Safe property getters
export const getUserName = (user: any): string => {
  return user?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
};

export const getUserAvatar = (user: any): string | undefined => {
  return user?.avatar_url || user?.user_metadata?.avatar_url;
};

export const getVenueDistance = (venue: any): string => {
  return venue?.distance || '0.5 mi';
};

export const getVenueMatchScore = (venue: any): number => {
  return venue?.matchScore || Math.floor(Math.random() * 30) + 70;
};
