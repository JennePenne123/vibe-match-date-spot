import { supabase } from '@/integrations/supabase/client';

export interface LocationWithSource {
  latitude: number;
  longitude: number;
  address: string;
  source: 'user_preferences' | 'browser_geolocation' | 'default';
}

export type LocationSource = 'user_preferences' | 'browser_geolocation' | 'none';

/**
 * Get location fallback with priority:
 * 1. User's saved home location from preferences
 * 2. Configurable default location
 */
export const getLocationFallback = async (userId?: string): Promise<LocationWithSource | null> => {
  // 1. Try user's saved location from preferences if userId provided
  if (userId) {
    try {
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('home_latitude, home_longitude, home_address')
        .eq('user_id', userId)
        .single();

      if (prefs?.home_latitude && prefs?.home_longitude) {
        console.log('📍 Using user saved home location');
        return {
          latitude: prefs.home_latitude,
          longitude: prefs.home_longitude,
          address: prefs.home_address || 'Saved location',
          source: 'user_preferences'
        };
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch user location preferences:', error);
    }
  }

  // 2. Try browser geolocation
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          maximumAge: 300000, // 5 min cache
          enableHighAccuracy: false,
        });
      });
      console.log('📍 Using browser geolocation');
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: 'Current location',
        source: 'browser_geolocation',
      };
    } catch (geoError) {
      console.warn('⚠️ Browser geolocation failed:', geoError);
    }
  }

  // 3. No fallback — user must set location
  console.log('📍 No location available — user must set their location in preferences');
  return null;
};

/**
 * Calculate distance from a reference location
 * Replaces the hardcoded Hamburg-based distance calculation
 */
export const calculateDistanceFromLocation = (
  venue: { latitude?: number; longitude?: number },
  referenceLocation: { latitude: number; longitude: number }
): string => {
  if (!venue.latitude || !venue.longitude) return 'Distance unavailable';
  
  const distance = calculateGeoDistanceKm(
    referenceLocation.latitude, 
    referenceLocation.longitude, 
    venue.latitude, 
    venue.longitude
  );
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

/**
 * Haversine formula for calculating distance between two coordinates
 */
function calculateGeoDistanceKm(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Validate if coordinates are within reasonable bounds
 */
export const isValidLocation = (lat: number, lon: number): boolean => {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};
