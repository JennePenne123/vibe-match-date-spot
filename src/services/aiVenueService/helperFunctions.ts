import { calculateGeoDistance } from '@/utils/stringUtils';
import { DEFAULT_FALLBACK_LOCATION } from '@/utils/locationFallback';

/**
 * Calculate distance from a reference location
 * Uses configurable fallback location instead of hardcoded Hamburg
 */
export const calculateDistanceFromLocation = (
  venue: any, 
  referenceLocation?: { latitude: number; longitude: number }
): string => {
  // Use provided reference or default fallback (New York)
  const refLat = referenceLocation?.latitude ?? DEFAULT_FALLBACK_LOCATION.latitude;
  const refLng = referenceLocation?.longitude ?? DEFAULT_FALLBACK_LOCATION.longitude;
  
  if (!venue.latitude || !venue.longitude) return 'Distance unavailable';
  
  const distance = calculateGeoDistance(refLat, refLng, venue.latitude, venue.longitude);
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

/**
 * @deprecated Use calculateDistanceFromLocation instead
 * Kept for backward compatibility - now uses configurable fallback
 */
export const calculateDistanceFromHamburg = (venue: any): string => {
  return calculateDistanceFromLocation(venue);
};