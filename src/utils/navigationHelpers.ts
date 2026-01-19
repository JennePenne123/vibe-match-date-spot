/**
 * Navigation helpers for generating directions URLs to map applications
 */

/**
 * Detect if the user is on an iOS device
 */
const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

interface DirectionsOptions {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  destName?: string;
  mode?: 'driving' | 'walking';
}

/**
 * Generate a platform-appropriate directions URL
 * - iOS devices: Opens Apple Maps
 * - Android/Desktop: Opens Google Maps
 */
export const getDirectionsUrl = (options: DirectionsOptions): string => {
  const { 
    originLat, 
    originLng, 
    destLat, 
    destLng, 
    destName, 
    mode = 'driving' 
  } = options;

  if (isIOS()) {
    // Apple Maps URL scheme
    // dirflg: d = driving, w = walking
    const travelMode = mode === 'walking' ? 'w' : 'd';
    return `maps://maps.apple.com/?saddr=${originLat},${originLng}&daddr=${destLat},${destLng}&dirflg=${travelMode}`;
  }

  // Google Maps URL (works on Android and desktop browsers)
  const travelMode = mode === 'walking' ? 'walking' : 'driving';
  const destination = destName 
    ? encodeURIComponent(destName) 
    : `${destLat},${destLng}`;
  
  return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destination}&travelmode=${travelMode}`;
};

/**
 * Open directions in the appropriate maps app
 */
export const openDirections = (options: DirectionsOptions): void => {
  const url = getDirectionsUrl(options);
  window.open(url, '_blank', 'noopener,noreferrer');
};

interface CurrentLocationDirectionsOptions {
  destLat: number;
  destLng: number;
  destName?: string;
  mode?: 'driving' | 'walking';
}

/**
 * Generate a directions URL that uses the device's current location as origin
 * The maps app will request GPS permission automatically
 */
export const getDirectionsUrlFromCurrentLocation = (options: CurrentLocationDirectionsOptions): string => {
  const { destLat, destLng, destName, mode = 'driving' } = options;

  if (isIOS()) {
    // Apple Maps: "Current Location" as saddr
    const travelMode = mode === 'walking' ? 'w' : 'd';
    return `maps://maps.apple.com/?saddr=Current%20Location&daddr=${destLat},${destLng}&dirflg=${travelMode}`;
  }

  // Google Maps: Empty/omitted origin uses current location
  const travelMode = mode === 'walking' ? 'walking' : 'driving';
  const destination = destName 
    ? encodeURIComponent(destName) 
    : `${destLat},${destLng}`;
  
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=${travelMode}`;
};

/**
 * Open directions from current GPS location in the appropriate maps app
 */
export const openDirectionsFromCurrentLocation = (options: CurrentLocationDirectionsOptions): void => {
  const url = getDirectionsUrlFromCurrentLocation(options);
  window.open(url, '_blank', 'noopener,noreferrer');
};
