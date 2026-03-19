/**
 * API Configuration for Venue Search
 * Strategy: Radar (primary search, 100K free/month) + Foursquare (enrichment: photos, tips, ratings)
 */

export type VenueSearchStrategy = 'radar-foursquare' | 'foursquare-only' | 'parallel';

export const API_CONFIG = {
  // API toggles
  useRadar: true,          // Primary search (100K free calls/month)
  useFoursquare: true,     // Enrichment: photos, tips, ratings
  useGooglePlaces: true,   // Enabled as fallback for niche venue types (museums, bowling, etc.)
  
  // Search strategy
  venueSearchStrategy: 'radar-foursquare' as VenueSearchStrategy,
  
  // Data merging
  mergeVenueData: true,
  
  // Limits
  maxVenuesPerSource: 20,
  maxTotalVenues: 30,
  
  // Deduplication
  deduplicationThreshold: 50,
  nameSimilarityThreshold: 0.8,
  
  // Caching
  venueDetailsCacheDuration: 24 * 60 * 60 * 1000, // 24 hours
  tipsCacheDuration: 6 * 60 * 60 * 1000, // 6 hours
  enrichmentCacheDuration: 24 * 60 * 60 * 1000, // 24 hours for Foursquare enrichment
  
  // Timeouts
  radarTimeout: 10000,
  foursquareTimeout: 10000,
  googlePlacesTimeout: 10000,
  
  // Fallback behavior
  requireAtLeastOneSource: true,
  minVenuesForSuccess: 3,
  
  // Daily budget caps (cost control)
  maxRadarCallsPerDay: 3000,     // Well within 100K/month free tier
  maxFoursquareCallsPerDay: 150, // Conservative for 200/day free tier
  maxGooglePlacesCallsPerDay: 0, // Disabled
  
  // AI Enhancement
  aiEnhancementEnabled: false,
  aiEnhancementTopN: 3,
  aiEnhancementCostPerCall: 0.01,
};

/**
 * Feature flags for gradual rollout
 */
export const FEATURE_FLAGS = {
  showFoursquareTips: true,
  showFoursquarePhotos: true,
  showVerifiedBadge: true,
  showDetailedCategories: true,
  showChainDetection: true,  // Radar chain detection
  enableDebugLogging: true,
  
  // AI Pipeline features
  enableAIPipelineVisualization: true,
  enableAIEnhancement: false,
};
