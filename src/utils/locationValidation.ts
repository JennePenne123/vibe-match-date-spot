export interface LocationValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateLocation = (userLocation?: { latitude: number; longitude: number; address?: string }): LocationValidationResult => {
  if (!userLocation) {
    return { isValid: false, error: 'No location provided' };
  }
  
  const { latitude, longitude } = userLocation;
  
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return { isValid: false, error: 'Invalid coordinate types - must be numbers' };
  }
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return { isValid: false, error: 'Invalid coordinates - NaN values' };
  }
  
  if (latitude < -90 || latitude > 90) {
    return { isValid: false, error: 'Invalid latitude range - must be between -90 and 90' };
  }
  
  if (longitude < -180 || longitude > 180) {
    return { isValid: false, error: 'Invalid longitude range - must be between -180 and 180' };
  }
  
  // Additional validation: Not in the middle of the ocean
  if (latitude === 0 && longitude === 0) {
    return { isValid: false, error: 'Invalid null coordinates (0,0)' };
  }
  
  // Check for obviously fake coordinates
  if (Math.abs(latitude) < 0.001 && Math.abs(longitude) < 0.001) {
    return { isValid: false, error: 'Coordinates too close to origin - likely invalid' };
  }
  
  return { isValid: true };
};

export const formatLocationForDisplay = (location: { latitude: number; longitude: number; address?: string }): string => {
  if (location.address) {
    return location.address;
  }
  
  return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
};

export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};