export interface RouteInfo {
  distance: number;        // meters
  duration: number;        // seconds
  distanceText: string;    // "1.2 km" or "800 m"
  durationText: string;    // "5 min" or "1 hr 10 min"
}

interface RouteOptions {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  profile?: 'driving' | 'walking' | 'cycling';
}

// Cache to avoid redundant API calls
const routeCache = new Map<string, { data: RouteInfo; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const getCacheKey = (options: RouteOptions): string => {
  const { originLat, originLng, destLat, destLng, profile = 'driving' } = options;
  return `${originLat.toFixed(4)},${originLng.toFixed(4)}-${destLat.toFixed(4)},${destLng.toFixed(4)}-${profile}`;
};

const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours} hr ${remainingMins} min` : `${hours} hr`;
};

export const getRouteInfo = async (options: RouteOptions): Promise<RouteInfo | null> => {
  const { originLat, originLng, destLat, destLng, profile = 'driving' } = options;
  
  // Check cache first
  const cacheKey = getCacheKey(options);
  const cached = routeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // OSRM profile mapping
  const osrmProfile = profile === 'walking' ? 'foot' : profile === 'cycling' ? 'bike' : 'car';
  
  const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${originLng},${originLat};${destLng},${destLat}?overview=false`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('OSRM API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.code !== 'Ok' || !data.routes?.[0]) {
      console.error('OSRM routing failed:', data.code);
      return null;
    }
    
    const route = data.routes[0];
    const routeInfo: RouteInfo = {
      distance: route.distance,
      duration: route.duration,
      distanceText: formatDistance(route.distance),
      durationText: formatDuration(route.duration)
    };
    
    // Cache the result
    routeCache.set(cacheKey, { data: routeInfo, timestamp: Date.now() });
    
    return routeInfo;
  } catch (error) {
    console.error('OSRM routing error:', error);
    return null;
  }
};

// Fetch both driving and walking routes in parallel
export const getRouteInfoBoth = async (options: Omit<RouteOptions, 'profile'>): Promise<{
  driving: RouteInfo | null;
  walking: RouteInfo | null;
}> => {
  const [driving, walking] = await Promise.all([
    getRouteInfo({ ...options, profile: 'driving' }),
    getRouteInfo({ ...options, profile: 'walking' })
  ]);
  
  return { driving, walking };
};
