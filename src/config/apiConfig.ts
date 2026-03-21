/**
 * API Configuration for Venue Search
 * Strategy: Radar (primary, 100K free/month) + Overpass/OSM (free, unlimited) + Google Places (fallback)
 */

export type VenueSearchStrategy = 'radar-overpass' | 'overpass-only' | 'parallel';

export const API_CONFIG = {
  // API toggles
  useRadar: true,          // Primary search (100K free calls/month)
  useOverpass: true,       // Secondary search (OpenStreetMap, completely free)
  useGooglePlaces: true,   // Fallback for niche venue types
  useTripAdvisor: true,    // Enrichment: TripAdvisor reviews
  
  // Search strategy
  venueSearchStrategy: 'radar-overpass' as VenueSearchStrategy,
  
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
  enrichmentCacheDuration: 24 * 60 * 60 * 1000, // 24 hours
  
  // Timeouts
  radarTimeout: 10000,
  overpassTimeout: 15000,
  googlePlacesTimeout: 10000,
  tripAdvisorTimeout: 10000,
  
  // Fallback behavior
  requireAtLeastOneSource: true,
  minVenuesForSuccess: 3,
  
  // Daily budget caps (cost control)
  maxRadarCallsPerDay: 3000,       // Well within 100K/month free tier
  maxOverpassCallsPerDay: 10000,   // No limit, but be nice to the public API
  maxGooglePlacesCallsPerDay: 100, // Fallback only (~$1.70/day max)
  maxTripAdvisorCallsPerDay: 100,  // Free tier: 5000/month ≈ ~166/day
  
  // AI Enhancement
  aiEnhancementEnabled: false,
  aiEnhancementTopN: 3,
  aiEnhancementCostPerCall: 0.01,
};

/**
 * Feature flags for gradual rollout
 */
export const FEATURE_FLAGS = {
  showVerifiedBadge: true,
  showDetailedCategories: true,
  showChainDetection: true,  // Radar chain detection
  enableDebugLogging: true,
  
  // AI Pipeline features
  enableAIPipelineVisualization: true,
  enableAIEnhancement: false,
};
