export interface LocationValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateLocation = (location: { latitude: number; longitude: number } | null): LocationValidationResult => {
  if (!location) {
    return { isValid: false, error: 'Location is required for venue search' };
  }

  const { latitude, longitude } = location;

  // Check if coordinates are valid numbers
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return { isValid: false, error: 'Invalid location coordinates' };
  }

  // Check if coordinates are within valid ranges
  if (latitude < -90 || latitude > 90) {
    return { isValid: false, error: 'Invalid latitude value' };
  }

  if (longitude < -180 || longitude > 180) {
    return { isValid: false, error: 'Invalid longitude value' };
  }

  // Check if coordinates are not (0, 0) which might indicate a default/invalid location
  if (latitude === 0 && longitude === 0) {
    return { isValid: false, error: 'Location coordinates appear to be invalid' };
  }

  return { isValid: true };
};

export const isHTTPS = (): boolean => {
  return window.location.protocol === 'https:' || window.location.hostname === 'localhost';
};

export const canUseGeolocation = (): boolean => {
  return 'geolocation' in navigator && isHTTPS();
};