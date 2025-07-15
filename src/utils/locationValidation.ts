export interface LocationValidationResult {
  isValid: boolean;
  error?: string;
}

export interface LocationPermissionResult {
  granted: boolean;
  error?: string;
  position?: GeolocationPosition;
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

export const requestLocationPermission = (): Promise<LocationPermissionResult> => {
  return new Promise((resolve) => {
    if (!canUseGeolocation()) {
      resolve({
        granted: false,
        error: 'Geolocation not supported or not HTTPS'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          granted: true,
          position
        });
      },
      (error) => {
        let errorMessage = 'Location access denied';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        resolve({
          granted: false,
          error: errorMessage
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};