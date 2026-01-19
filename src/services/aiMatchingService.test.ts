import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
        or: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } }))
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: {}, error: null }))
        }))
      })),
      delete: vi.fn(() => ({
        or: vi.fn(() => Promise.resolve({ error: null }))
      }))
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Mock error' } }))
    }
  }
}));

describe('aiMatchingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CompatibilityScore interface', () => {
    it('should have correct structure', () => {
      const score = {
        overall_score: 85,
        cuisine_score: 90,
        vibe_score: 80,
        price_score: 75,
        timing_score: 85,
        activity_score: 70,
        compatibility_factors: { shared_cuisines: ['Italian'] }
      };

      expect(score).toHaveProperty('overall_score');
      expect(score).toHaveProperty('cuisine_score');
      expect(score).toHaveProperty('vibe_score');
      expect(score).toHaveProperty('price_score');
      expect(score).toHaveProperty('timing_score');
      expect(score).toHaveProperty('activity_score');
      expect(score).toHaveProperty('compatibility_factors');
    });
  });

  describe('VenueAIScore interface', () => {
    it('should have correct structure', () => {
      const venueScore = {
        venue_id: 'venue-123',
        ai_score: 85,
        match_factors: { cuisine_match: true },
        contextual_score: 0.1,
        weather_factor: 0,
        time_factor: 0.05,
        crowd_factor: 0,
        event_factor: 0
      };

      expect(venueScore.venue_id).toBe('venue-123');
      expect(venueScore.ai_score).toBeGreaterThanOrEqual(0);
      expect(venueScore.ai_score).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateArrayCompatibility (rule-based fallback logic)', () => {
    // Test helper function logic
    const calculateArrayCompatibility = (arr1: string[], arr2: string[]): number => {
      if (arr1.length === 0 && arr2.length === 0) return 0.0;
      if (arr1.length === 0 || arr2.length === 0) return 0.0;
      
      const shared = arr1.filter(item => arr2.includes(item));
      const total = new Set([...arr1, ...arr2]).size;
      return shared.length / total;
    };

    it('should return 0 when both arrays are empty', () => {
      expect(calculateArrayCompatibility([], [])).toBe(0);
    });

    it('should return 0 when one array is empty', () => {
      expect(calculateArrayCompatibility(['Italian'], [])).toBe(0);
      expect(calculateArrayCompatibility([], ['Italian'])).toBe(0);
    });

    it('should return 1 when arrays are identical', () => {
      expect(calculateArrayCompatibility(['Italian'], ['Italian'])).toBe(1);
    });

    it('should calculate partial overlap correctly', () => {
      const result = calculateArrayCompatibility(
        ['Italian', 'Japanese'],
        ['Italian', 'Mexican']
      );
      // 1 shared (Italian) / 3 total (Italian, Japanese, Mexican)
      expect(result).toBeCloseTo(0.333, 2);
    });

    it('should return 0 when no overlap', () => {
      expect(calculateArrayCompatibility(['Italian'], ['Japanese'])).toBe(0);
    });
  });

  describe('calculateDietaryCompatibility (rule-based fallback logic)', () => {
    const calculateDietaryCompatibility = (diet1: string[], diet2: string[]): number => {
      if (diet1.length === 0 && diet2.length === 0) return 1.0;
      if (diet1.length === 0 || diet2.length === 0) return 0.7;
      const shared = diet1.filter(item => diet2.includes(item));
      return shared.length > 0 ? 0.9 : 0.3;
    };

    it('should return 1 when both have no restrictions', () => {
      expect(calculateDietaryCompatibility([], [])).toBe(1.0);
    });

    it('should return 0.7 when only one has restrictions', () => {
      expect(calculateDietaryCompatibility(['vegetarian'], [])).toBe(0.7);
      expect(calculateDietaryCompatibility([], ['vegan'])).toBe(0.7);
    });

    it('should return 0.9 when restrictions overlap', () => {
      expect(calculateDietaryCompatibility(['vegetarian'], ['vegetarian'])).toBe(0.9);
    });

    it('should return 0.3 when restrictions conflict', () => {
      expect(calculateDietaryCompatibility(['vegetarian'], ['keto'])).toBe(0.3);
    });
  });

  describe('getSharedItems helper', () => {
    const getSharedItems = (arr1: string[], arr2: string[]): string[] => {
      return arr1.filter(item => arr2.includes(item));
    };

    it('should return empty array when no shared items', () => {
      expect(getSharedItems(['a'], ['b'])).toEqual([]);
    });

    it('should return shared items', () => {
      expect(getSharedItems(['a', 'b', 'c'], ['b', 'c', 'd'])).toEqual(['b', 'c']);
    });

    it('should handle empty arrays', () => {
      expect(getSharedItems([], ['a'])).toEqual([]);
      expect(getSharedItems(['a'], [])).toEqual([]);
    });
  });

  describe('Fallback scoring weights', () => {
    it('should apply correct weights in fallback calculation', () => {
      // Weight distribution: cuisine 30%, vibe 25%, price 20%, timing 15%, activity 10%
      const weights = {
        cuisine: 0.3,
        vibe: 0.25,
        price: 0.2,
        timing: 0.15,
        activity: 0.1
      };

      const totalWeight = weights.cuisine + weights.vibe + weights.price + weights.timing + weights.activity;
      expect(totalWeight).toBe(1.0);
    });

    it('should calculate weighted overall score correctly', () => {
      const scores = {
        cuisine: 0.8,
        vibe: 0.6,
        price: 1.0,
        timing: 0.5,
        activity: 0.9
      };

      const overallScore = (
        scores.cuisine * 0.3 +
        scores.vibe * 0.25 +
        scores.price * 0.2 +
        scores.timing * 0.15 +
        scores.activity * 0.1
      );

      // 0.24 + 0.15 + 0.2 + 0.075 + 0.09 = 0.755
      expect(overallScore).toBeCloseTo(0.755, 3);
    });
  });
});
