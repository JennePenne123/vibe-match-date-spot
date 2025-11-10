/**
 * API Configuration for Venue Search
 * Controls which APIs are used and search strategy
 */

export type VenueSearchStrategy = 'parallel' | 'google-first' | 'foursquare-first';

export const API_CONFIG = {
  // API toggles
  useGooglePlaces: true,
  useFoursquare: true,
  
  // Search strategy: 'parallel' | 'google-first' | 'foursquare-first'
  venueSearchStrategy: 'parallel' as VenueSearchStrategy,
  
  // Data merging
  mergeVenueData: true, // Combine data from both APIs for same venue
  
  // Limits
  maxVenuesPerSource: 20,
  maxTotalVenues: 30,
  
  // Deduplication
  deduplicationThreshold: 50, // meters - venues within this distance are considered duplicates
  nameSimilarityThreshold: 0.8, // 0-1 - how similar names must be to be considered same venue
  
  // Caching
  venueDetailsCacheDuration: 24 * 60 * 60 * 1000, // 24 hours in ms
  tipsCacheDuration: 6 * 60 * 60 * 1000, // 6 hours in ms
  
  // Timeouts
  googlePlacesTimeout: 10000, // 10 seconds
  foursquareTimeout: 10000, // 10 seconds
  
  // Fallback behavior
  requireAtLeastOneSource: true, // If true, fail if both APIs fail
  minVenuesForSuccess: 3, // Minimum venues needed to consider search successful
};

/**
 * Feature flags for gradual rollout
 */
export const FEATURE_FLAGS = {
  showFoursquareTips: true,
  showFoursquarePhotos: true,
  showVerifiedBadge: true,
  showDetailedCategories: true,
  enableDebugLogging: true,
};
