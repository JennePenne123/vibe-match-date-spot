import { AIVenueRecommendation } from '@/services/aiVenueService/recommendations';

// Validate and normalize venue ID format
export const normalizeVenueId = (venueId: string | undefined | null): string | null => {
  if (!venueId) return null;
  
  // Remove any whitespace and ensure string format
  const normalized = String(venueId).trim();
  
  // Basic validation - must be non-empty
  if (normalized.length === 0) return null;
  
  return normalized;
};

// Validate that venue data has required fields
export const validateVenueRecommendation = (venue: any): venue is AIVenueRecommendation => {
  if (!venue || typeof venue !== 'object') return false;
  
  // Check required fields
  const hasVenueId = Boolean(venue.venue_id);
  const hasVenueName = Boolean(venue.venue_name);
  const hasValidScore = typeof venue.ai_score === 'number';
  
  if (!hasVenueId) {
    console.warn('🚫 VENUE VALIDATION: Missing venue_id:', venue);
    return false;
  }
  
  if (!hasVenueName) {
    console.warn('🚫 VENUE VALIDATION: Missing venue_name:', venue);
    return false;
  }
  
  if (!hasValidScore) {
    console.warn('🚫 VENUE VALIDATION: Invalid ai_score:', venue);
    return false;
  }
  
  return true;
};

// Find venue in recommendations with fallback logic
export const findVenueInRecommendations = (
  venueId: string, 
  recommendations: AIVenueRecommendation[]
): AIVenueRecommendation | null => {
  if (!venueId || !recommendations || recommendations.length === 0) {
    return null;
  }
  
  const normalizedId = normalizeVenueId(venueId);
  if (!normalizedId) return null;
  
  // Direct match first
  let venue = recommendations.find(v => v.venue_id === normalizedId);
  if (venue) return venue;
  
  // Fallback: case-insensitive match
  venue = recommendations.find(v => 
    v.venue_id.toLowerCase() === normalizedId.toLowerCase()
  );
  if (venue) return venue;
  
  // Fallback: partial match (for mock IDs that might have variations)
  venue = recommendations.find(v => 
    v.venue_id.includes(normalizedId) || normalizedId.includes(v.venue_id)
  );
  
  return venue || null;
};

// Transform raw venue data to AIVenueRecommendation with validation
export const transformToVenueRecommendation = (venue: any): AIVenueRecommendation | null => {
  if (!venue || typeof venue !== 'object') {
    console.warn('🚫 TRANSFORM: Invalid venue data:', venue);
    return null;
  }
  
  console.log('🔧 TRANSFORM: Processing venue:', {
    venue_id: venue.venue_id || venue.id,
    venue_name: venue.venue_name || venue.name,
    ai_score: venue.ai_score,
    hasId: !!(venue.venue_id || venue.id),
    hasName: !!(venue.venue_name || venue.name),
    hasScore: typeof venue.ai_score === 'number'
  });
  
  try {
    // Ensure we have essential fields with robust fallbacks
    const venueId = normalizeVenueId(venue.venue_id || venue.id);
    const venueName = venue.venue_name || venue.name;
    const aiScore = typeof venue.ai_score === 'number' ? venue.ai_score : 
                   typeof venue.score === 'number' ? venue.score : 0;
    
    if (!venueId) {
      console.warn('🚫 TRANSFORM: No valid venue ID found, generating fallback');
    }
    
    if (!venueName) {
      console.warn('🚫 TRANSFORM: No valid venue name found');
    }

    const transformed: AIVenueRecommendation = {
      venue_id: venueId || `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      venue_name: venueName || 'Unnamed Venue',
      venue_address: venue.address || venue.venue_address || 'Address not available',
      venue_image: venue.venue_image || venue.image || venue.image_url,
      venue_photos: venue.venue_photos || venue.photos || [],
      ai_score: aiScore,
      match_factors: venue.match_factors || {},
      contextual_score: venue.contextual_score || aiScore,
      ai_reasoning: venue.ai_reasoning || 'AI analysis completed',
      confidence_level: typeof venue.confidence_level === 'number' ? venue.confidence_level : 0.8,
      distance: venue.distance,
      neighborhood: venue.neighborhood,
      isOpen: venue.isOpen,
      operatingHours: venue.operatingHours || venue.opening_hours || [],
      priceRange: venue.price_range || venue.priceRange,
      rating: venue.rating,
      cuisine_type: venue.cuisine_type,
      amenities: venue.amenities || []
    };
    
    console.log('🔧 TRANSFORM: Created transformed venue:', {
      venue_id: transformed.venue_id,
      venue_name: transformed.venue_name,
      ai_score: transformed.ai_score
    });
    
    // Validate the transformed result
    if (validateVenueRecommendation(transformed)) {
      console.log('✅ TRANSFORM: Venue passed validation:', transformed.venue_id);
      return transformed;
    } else {
      console.error('🚫 TRANSFORM: Validation failed after transformation:', transformed);
      return null;
    }
  } catch (error) {
    console.error('🚫 TRANSFORM: Error transforming venue:', error, venue);
    return null;
  }
};

// Debug venue data structure
export const debugVenueData = (venues: any[], context: string = 'Unknown'): void => {
  console.log(`🔍 VENUE DEBUG [${context}]:`, {
    count: venues?.length || 0,
    sampleVenue: venues?.[0] ? {
      keys: Object.keys(venues[0]),
      venue_id: venues[0].venue_id || venues[0].id,
      venue_name: venues[0].venue_name || venues[0].name,
      ai_score: venues[0].ai_score,
      hasImage: !!(venues[0].venue_image || venues[0].image),
      type: typeof venues[0]
    } : null,
    allVenueIds: venues?.slice(0, 3)?.map(v => v.venue_id || v.id) || []
  });
};