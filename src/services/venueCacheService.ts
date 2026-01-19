
/**
 * Venue Cache Service
 * Caches venue search results to reduce API calls
 */

interface CachedVenueSearch {
  venues: any[];
  timestamp: number;
  searchParams: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

const CACHE_KEY_PREFIX = 'vybepulse_venue_cache_';
const CACHE_STATS_KEY = 'vybepulse_cache_stats';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_ENTRIES = 50;

// Round coordinates to 3 decimal places (~111m precision)
const roundCoordinate = (coord: number): number => Math.round(coord * 1000) / 1000;

// Generate cache key from search parameters
const generateCacheKey = (
  lat: number,
  lng: number,
  cuisines?: string[],
  priceRange?: string[],
  vibes?: string[]
): string => {
  const roundedLat = roundCoordinate(lat);
  const roundedLng = roundCoordinate(lng);
  const cuisineStr = cuisines?.sort().join(',') || '';
  const priceStr = priceRange?.sort().join(',') || '';
  const vibeStr = vibes?.sort().join(',') || '';
  
  return `${CACHE_KEY_PREFIX}${roundedLat}_${roundedLng}_${cuisineStr}_${priceStr}_${vibeStr}`;
};

// Get all cache keys from localStorage
const getAllCacheKeys = (): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
};

// Evict oldest entries if cache is full (LRU)
const evictOldestEntries = (): void => {
  const keys = getAllCacheKeys();
  if (keys.length < MAX_CACHE_ENTRIES) return;
  
  const entries: { key: string; timestamp: number }[] = [];
  
  for (const key of keys) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed: CachedVenueSearch = JSON.parse(data);
        entries.push({ key, timestamp: parsed.timestamp });
      }
    } catch {
      // Remove corrupted entries
      localStorage.removeItem(key);
    }
  }
  
  // Sort by timestamp (oldest first) and remove oldest entries
  entries.sort((a, b) => a.timestamp - b.timestamp);
  const toRemove = entries.slice(0, Math.max(1, entries.length - MAX_CACHE_ENTRIES + 10));
  
  for (const entry of toRemove) {
    localStorage.removeItem(entry.key);
  }
};

// Update cache statistics
const updateStats = (hit: boolean): void => {
  try {
    const statsStr = localStorage.getItem(CACHE_STATS_KEY);
    const stats: CacheStats = statsStr 
      ? JSON.parse(statsStr) 
      : { hits: 0, misses: 0, size: 0 };
    
    if (hit) {
      stats.hits++;
    } else {
      stats.misses++;
    }
    stats.size = getAllCacheKeys().length;
    
    localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.warn('Failed to update cache stats:', error);
  }
};

export const venueCacheService = {
  /**
   * Get cached venues for the given search parameters
   */
  getCachedSearch(
    lat: number,
    lng: number,
    cuisines?: string[],
    priceRange?: string[],
    vibes?: string[]
  ): any[] | null {
    try {
      const key = generateCacheKey(lat, lng, cuisines, priceRange, vibes);
      const cached = localStorage.getItem(key);
      
      if (!cached) {
        updateStats(false);
        return null;
      }
      
      const data: CachedVenueSearch = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - data.timestamp > CACHE_TTL) {
        localStorage.removeItem(key);
        updateStats(false);
        return null;
      }
      
      console.log('[VenueCache] Cache HIT for:', key);
      updateStats(true);
      return data.venues;
    } catch (error) {
      console.warn('[VenueCache] Error reading cache:', error);
      updateStats(false);
      return null;
    }
  },
  
  /**
   * Store venues in cache for the given search parameters
   */
  setCachedSearch(
    lat: number,
    lng: number,
    venues: any[],
    cuisines?: string[],
    priceRange?: string[],
    vibes?: string[]
  ): void {
    try {
      // Evict old entries if needed
      evictOldestEntries();
      
      const key = generateCacheKey(lat, lng, cuisines, priceRange, vibes);
      const data: CachedVenueSearch = {
        venues,
        timestamp: Date.now(),
        searchParams: key.replace(CACHE_KEY_PREFIX, '')
      };
      
      localStorage.setItem(key, JSON.stringify(data));
      console.log('[VenueCache] Cached', venues.length, 'venues for:', key);
    } catch (error) {
      console.warn('[VenueCache] Error writing cache:', error);
      // If storage is full, clear some old entries and retry
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearCache();
      }
    }
  },
  
  /**
   * Clear all cached venue searches
   */
  clearCache(): void {
    const keys = getAllCacheKeys();
    for (const key of keys) {
      localStorage.removeItem(key);
    }
    localStorage.removeItem(CACHE_STATS_KEY);
    console.log('[VenueCache] Cache cleared');
  },
  
  /**
   * Invalidate cache for a specific location
   */
  invalidateLocation(lat: number, lng: number): void {
    const roundedLat = roundCoordinate(lat);
    const roundedLng = roundCoordinate(lng);
    const prefix = `${CACHE_KEY_PREFIX}${roundedLat}_${roundedLng}_`;
    
    const keys = getAllCacheKeys();
    let removed = 0;
    for (const key of keys) {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
        removed++;
      }
    }
    console.log('[VenueCache] Invalidated', removed, 'entries for location:', roundedLat, roundedLng);
  },
  
  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    try {
      const statsStr = localStorage.getItem(CACHE_STATS_KEY);
      const stats: CacheStats = statsStr 
        ? JSON.parse(statsStr) 
        : { hits: 0, misses: 0, size: 0 };
      stats.size = getAllCacheKeys().length;
      return stats;
    } catch {
      return { hits: 0, misses: 0, size: 0 };
    }
  },
  
  /**
   * Get cache hit rate as percentage
   */
  getHitRate(): number {
    const stats = this.getCacheStats();
    const total = stats.hits + stats.misses;
    return total > 0 ? Math.round((stats.hits / total) * 100) : 0;
  }
};
