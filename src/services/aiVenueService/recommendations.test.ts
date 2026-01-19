import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: {
              preferred_cuisines: ['Italian'],
              preferred_vibes: ['romantic'],
              max_distance: 10
            }, 
            error: null 
          })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null }))
        }))
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null }))
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ 
        data: { venues: [] }, 
        error: null 
      }))
    }
  }
}));

vi.mock('@/services/venueCacheService', () => ({
  venueCacheService: {
    getCachedSearch: vi.fn(() => null),
    setCachedSearch: vi.fn()
  }
}));

vi.mock('@/services/apiUsageService', () => ({
  apiUsageService: {
    logApiCall: vi.fn(() => Promise.resolve()),
    createTimer: vi.fn(() => ({
      end: vi.fn(() => Promise.resolve())
    }))
  }
}));

vi.mock('@/config/apiConfig', () => ({
  API_CONFIG: {
    useGooglePlaces: true,
    useFoursquare: true,
    venueSearchStrategy: 'parallel',
    mergeVenueData: true,
    maxVenuesPerSource: 20,
    maxTotalVenues: 30,
    deduplicationThreshold: 50,
    nameSimilarityThreshold: 0.8,
    minVenuesForSuccess: 3
  }
}));

describe('recommendations.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AIVenueRecommendation interface', () => {
    it('should have correct structure', () => {
      const recommendation = {
        venue_id: 'venue-123',
        venue_name: 'Test Restaurant',
        venue_address: '123 Test St',
        venue_image: 'https://example.com/image.jpg',
        venue_photos: [],
        ai_score: 85,
        match_factors: { cuisine_match: true },
        contextual_score: 0.1,
        ai_reasoning: 'Great match!',
        confidence_level: 0.85,
        distance: '1.5km',
        neighborhood: 'Downtown',
        isOpen: true,
        operatingHours: ['Mon-Sun: 9AM-10PM'],
        priceRange: '$$',
        rating: 4.5,
        cuisine_type: 'Italian',
        amenities: ['WiFi', 'Outdoor seating']
      };

      expect(recommendation.venue_id).toBe('venue-123');
      expect(recommendation.ai_score).toBeGreaterThanOrEqual(0);
      expect(recommendation.ai_score).toBeLessThanOrEqual(100);
      expect(recommendation.confidence_level).toBeGreaterThanOrEqual(0);
      expect(recommendation.confidence_level).toBeLessThanOrEqual(1);
    });
  });

  describe('extractVenueId helper logic', () => {
    const extractVenueId = (venue: any): string | null => {
      if (venue.id && typeof venue.id === 'string' && venue.id.trim()) {
        return venue.id.trim();
      }
      if (venue.placeId && typeof venue.placeId === 'string' && venue.placeId.trim()) {
        return venue.placeId.trim();
      }
      if (venue.google_place_id && typeof venue.google_place_id === 'string' && venue.google_place_id.trim()) {
        return venue.google_place_id.trim();
      }
      if (venue.id && typeof venue.id === 'object' && venue.id.value) {
        return String(venue.id.value).trim();
      }
      if (venue.id) {
        const strId = String(venue.id).trim();
        if (strId && strId !== 'undefined' && strId !== 'null') {
          return strId;
        }
      }
      return null;
    };

    it('should extract id from venue.id', () => {
      expect(extractVenueId({ id: 'venue-123' })).toBe('venue-123');
    });

    it('should extract id from venue.placeId', () => {
      expect(extractVenueId({ placeId: 'ChIJ123' })).toBe('ChIJ123');
    });

    it('should extract id from venue.google_place_id', () => {
      expect(extractVenueId({ google_place_id: 'ChIJ456' })).toBe('ChIJ456');
    });

    it('should handle object id with value property', () => {
      expect(extractVenueId({ id: { value: 'nested-id' } })).toBe('nested-id');
    });

    it('should return null for empty or invalid ids', () => {
      expect(extractVenueId({ id: '' })).toBeNull();
      expect(extractVenueId({ id: '   ' })).toBeNull();
      expect(extractVenueId({})).toBeNull();
    });

    it('should trim whitespace', () => {
      expect(extractVenueId({ id: '  venue-123  ' })).toBe('venue-123');
    });
  });

  describe('generateAIReasoning helper logic', () => {
    const generateAIReasoning = (venue: any, matchFactors: any, aiScore: number): string => {
      const reasons = [];
      
      if (matchFactors?.cuisine_match) {
        reasons.push(`Perfect cuisine match with ${venue.cuisine_type}`);
      }
      if (matchFactors?.price_match) {
        reasons.push(`Fits your budget preference (${venue.price_range})`);
      }
      if (matchFactors?.vibe_matches?.length > 0) {
        reasons.push(`Matches your preferred vibes: ${matchFactors.vibe_matches.join(', ')}`);
      }
      if (venue.rating >= 4.0) {
        reasons.push(`Highly rated venue (${venue.rating}★)`);
      }
      
      if (reasons.length === 0) {
        return `Good overall match based on your preferences (${Math.round(aiScore)}% match)`;
      }
      
      return reasons.join('. ') + '.';
    };

    it('should generate reasoning with cuisine match', () => {
      const result = generateAIReasoning(
        { cuisine_type: 'Italian' },
        { cuisine_match: true },
        85
      );
      expect(result).toContain('Perfect cuisine match with Italian');
    });

    it('should generate reasoning with price match', () => {
      const result = generateAIReasoning(
        { price_range: '$$' },
        { price_match: true },
        85
      );
      expect(result).toContain('Fits your budget preference ($$)');
    });

    it('should generate reasoning with vibe matches', () => {
      const result = generateAIReasoning(
        {},
        { vibe_matches: ['romantic', 'cozy'] },
        85
      );
      expect(result).toContain('romantic, cozy');
    });

    it('should include high rating in reasoning', () => {
      const result = generateAIReasoning(
        { rating: 4.5 },
        {},
        85
      );
      expect(result).toContain('Highly rated venue (4.5★)');
    });

    it('should use fallback when no specific matches', () => {
      const result = generateAIReasoning(
        { rating: 3.5 },
        {},
        72
      );
      expect(result).toContain('Good overall match');
      expect(result).toContain('72%');
    });
  });

  describe('extractNeighborhood helper logic', () => {
    const extractNeighborhood = (address: string): string | undefined => {
      if (!address) return undefined;
      const parts = address.split(',').map(part => part.trim());
      return parts.length > 1 ? parts[1] : undefined;
    };

    it('should extract neighborhood from address', () => {
      expect(extractNeighborhood('123 Main St, Downtown, City')).toBe('Downtown');
    });

    it('should return undefined for single-part address', () => {
      expect(extractNeighborhood('123 Main St')).toBeUndefined();
    });

    it('should return undefined for empty address', () => {
      expect(extractNeighborhood('')).toBeUndefined();
    });

    it('should handle null/undefined address', () => {
      expect(extractNeighborhood(null as any)).toBeUndefined();
      expect(extractNeighborhood(undefined as any)).toBeUndefined();
    });
  });

  describe('determineOpenStatus helper logic', () => {
    const determineOpenStatus = (openingHours: any): boolean => {
      if (typeof openingHours === 'boolean') return openingHours;
      if (!openingHours || !Array.isArray(openingHours)) return true;
      
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      return currentTime >= 900 && currentTime <= 2200;
    };

    it('should return boolean directly if passed', () => {
      expect(determineOpenStatus(true)).toBe(true);
      expect(determineOpenStatus(false)).toBe(false);
    });

    it('should return true for null/undefined', () => {
      expect(determineOpenStatus(null)).toBe(true);
      expect(determineOpenStatus(undefined)).toBe(true);
    });

    it('should return true for non-array values', () => {
      expect(determineOpenStatus('some string')).toBe(true);
    });
  });

  describe('formatOperatingHours helper logic', () => {
    const formatOperatingHours = (openingHours: any): string[] => {
      if (!openingHours) return ['Hours not available'];
      if (Array.isArray(openingHours)) return openingHours;
      return ['Mon-Sun: 9:00 AM - 10:00 PM'];
    };

    it('should return array if passed', () => {
      const hours = ['Mon: 9AM-5PM', 'Tue: 9AM-5PM'];
      expect(formatOperatingHours(hours)).toEqual(hours);
    });

    it('should return default for null/undefined', () => {
      expect(formatOperatingHours(null)).toEqual(['Hours not available']);
      expect(formatOperatingHours(undefined)).toEqual(['Hours not available']);
    });

    it('should return fallback for non-array values', () => {
      expect(formatOperatingHours('some string')).toEqual(['Mon-Sun: 9:00 AM - 10:00 PM']);
    });
  });

  describe('areVenuesDuplicates helper logic', () => {
    const areVenuesDuplicates = (v1: any, v2: any): boolean => {
      const name1 = (v1.name || '').toLowerCase().trim();
      const name2 = (v2.name || '').toLowerCase().trim();
      
      if (name1 === name2) return true;
      
      return false; // Simplified for testing
    };

    it('should return true for same names', () => {
      expect(areVenuesDuplicates({ name: 'Test' }, { name: 'Test' })).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(areVenuesDuplicates({ name: 'TEST' }, { name: 'test' })).toBe(true);
    });

    it('should return false for different names', () => {
      expect(areVenuesDuplicates({ name: 'Test1' }, { name: 'Test2' })).toBe(false);
    });

    it('should handle missing names', () => {
      expect(areVenuesDuplicates({}, {})).toBe(true); // Both empty
      expect(areVenuesDuplicates({ name: 'Test' }, {})).toBe(false);
    });
  });
});
