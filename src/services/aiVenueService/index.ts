
// Re-export all functionality from the refactored modules
export { calculateVenueAIScore, calculateContextualFactors, calculateConfidenceLevel } from './scoring';
export { getActiveVenues, getStoredAIScore } from './fetching';
export { getAIVenueRecommendations, generateAIReasoning, type AIVenueRecommendation } from './recommendations';

// Maintain backward compatibility by re-exporting the main functions
export type { AIVenueRecommendation } from './recommendations';
