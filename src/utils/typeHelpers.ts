
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

// Haversine distance in km
const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Format distance for display
export const formatDistance = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
};

// Calculate distance string between a venue and a user location
export const calcVenueDistance = (
  venue: { latitude?: number | null; longitude?: number | null },
  userLat?: number | null,
  userLng?: number | null
): string | null => {
  if (!venue?.latitude || !venue?.longitude || !userLat || !userLng) return null;
  const km = haversineKm(userLat, userLng, venue.latitude, venue.longitude);
  return formatDistance(km);
};

// Convert database Venue to AppVenue with UI properties
export const venueToAppVenue = (venue: Venue, userLat?: number | null, userLng?: number | null): AppVenue => {
  const computedDistance = calcVenueDistance(venue, userLat, userLng);

  return {
    ...venue,
    // Map database fields to UI fields
    image: venue.image_url,
    location: venue.address,
    distance: (venue as any).distance || computedDistance || undefined,
    matchScore: (venue as any).matchScore ?? undefined,
    discount: (venue as any).discount ?? undefined,
    isOpen: (venue as any).isOpen ?? undefined,
    openingHours: venue.opening_hours ? 
      (Array.isArray(venue.opening_hours) ? venue.opening_hours as string[] : ['Mon-Sun: 9:00 AM - 10:00 PM']) : 
      ['Mon-Sun: 9:00 AM - 10:00 PM'],
    placeId: venue.google_place_id,
    priceRange: venue.price_range
  };
};

// Safe property getters
export const getUserName = (user: any): string => {
  const name = user?.name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0];
  return name ?? 'User';
};

export const getUserAvatar = (user: any): string | undefined => {
  return user?.avatar_url ?? user?.user_metadata?.avatar_url ?? undefined;
};

export const getFallbackAvatar = (name: string | null | undefined): string => {
  // Generate a fallback avatar using UI Avatars service
  const safeName = name ?? 'User';
  const encodedName = encodeURIComponent(safeName);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=ffc0cb&color=fff&size=128&bold=true`;
};

export const getVenueDistance = (venue: any): string | undefined => {
  return venue?.distance ?? undefined;
};

export const getVenueMatchScore = (venue: any): number | undefined => {
  return venue?.matchScore ?? undefined;
};
