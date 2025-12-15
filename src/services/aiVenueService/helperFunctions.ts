import { calculateGeoDistance } from '@/utils/stringUtils';

// Helper function to calculate distance from Hamburg (fallback location)
export const calculateDistanceFromHamburg = (venue: any): string => {
  // Hamburg coordinates
  const hamburgLat = 53.5511;
  const hamburgLng = 9.9937;
  
  if (!venue.latitude || !venue.longitude) return 'Distance unavailable';
  
  const distance = calculateGeoDistance(hamburgLat, hamburgLng, venue.latitude, venue.longitude);
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};