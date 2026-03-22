import { calculateGeoDistance } from '@/utils/stringUtils';

/**
 * Calculate distance from a reference location
 * Uses configurable fallback location instead of hardcoded Hamburg
 */
export const calculateDistanceFromLocation = (
  venue: any, 
  referenceLocation?: { latitude: number; longitude: number }
): string => {
  if (!referenceLocation?.latitude || !referenceLocation?.longitude) {
    return 'Distance unavailable';
  }
  const refLat = referenceLocation.latitude;
  const refLng = referenceLocation.longitude;
  
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