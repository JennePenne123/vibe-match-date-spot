import { calculateGeoDistance } from '@/utils/stringUtils';

/**
 * Format distance consistently across the app
 * <100m → "XXm", <1km → "XXXm", <10km → "X.Xkm", ≥10km → "XXkm"
 */
const formatDistance = (km: number): string => {
  if (km < 0.1) return `${Math.round(km * 1000)}m`;
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
};

/**
 * Calculate distance from a reference location
 */
export const calculateDistanceFromLocation = (
  venue: any, 
  referenceLocation?: { latitude: number; longitude: number }
): string => {
  if (!referenceLocation?.latitude || !referenceLocation?.longitude) {
    return 'Distance unavailable';
  }
  
  const venueLat = venue.latitude ?? venue.lat ?? venue.geometry?.location?.lat;
  const venueLng = venue.longitude ?? venue.lng ?? venue.geometry?.location?.lng;
  
  if (!venueLat || !venueLng) return 'Distance unavailable';
  
  const distance = calculateGeoDistance(referenceLocation.latitude, referenceLocation.longitude, venueLat, venueLng);
  return formatDistance(distance);
};

/**
 * @deprecated Use calculateDistanceFromLocation instead
 */
export const calculateDistanceFromHamburg = (venue: any): string => {
  return calculateDistanceFromLocation(venue);
};