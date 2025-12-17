import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateContextualFactors, calculateConfidenceLevel } from './scoring';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

// Mock the learningIntegration module
vi.mock('./learningIntegration', () => ({
  getUserLearnedWeights: vi.fn(),
  getConfidenceBoost: vi.fn(() => 0),
  applyWeight: vi.fn((value) => value)
}));

describe('scoring', () => {
  describe('calculateContextualFactors', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return prime dinner time bonus (0.1) at 7 PM', async () => {
      // Set time to 7 PM on a summer day (July)
      vi.setSystemTime(new Date(2024, 6, 15, 19, 0, 0));
      
      const result = await calculateContextualFactors('venue-123');
      
      expect(result).toBe(0.1); // Only dinner bonus, no winter
    });

    it('should return lunch time bonus (0.05) at noon', async () => {
      // Set time to noon on a summer day
      vi.setSystemTime(new Date(2024, 6, 15, 12, 0, 0));
      
      const result = await calculateContextualFactors('venue-123');
      
      expect(result).toBe(0.05);
    });

    it('should return 0 at off-peak time (3 PM) in summer', async () => {
      // Set time to 3 PM on a summer day
      vi.setSystemTime(new Date(2024, 6, 15, 15, 0, 0));
      
      const result = await calculateContextualFactors('venue-123');
      
      expect(result).toBe(0);
    });

    it('should add winter bonus (0.05) in January', async () => {
      // Set time to 3 PM in January (off-peak, but winter)
      vi.setSystemTime(new Date(2024, 0, 15, 15, 0, 0));
      
      const result = await calculateContextualFactors('venue-123');
      
      expect(result).toBe(0.05); // Winter bonus only
    });

    it('should combine dinner and winter bonus', async () => {
      // Set time to 7 PM in December
      vi.setSystemTime(new Date(2024, 11, 15, 19, 0, 0));
      
      const result = await calculateContextualFactors('venue-123');
      
      expect(result).toBe(0.15); // 0.1 dinner + 0.05 winter
    });

    it('should combine lunch and winter bonus', async () => {
      // Set time to noon in November
      vi.setSystemTime(new Date(2024, 10, 15, 12, 0, 0));
      
      const result = await calculateContextualFactors('venue-123');
      
      expect(result).toBe(0.1); // 0.05 lunch + 0.05 winter
    });

    it('should return winter bonus only at off-peak winter time', async () => {
      // Set time to 10 AM in February
      vi.setSystemTime(new Date(2024, 1, 15, 10, 0, 0));
      
      const result = await calculateContextualFactors('venue-123');
      
      expect(result).toBe(0.05); // Winter bonus only
    });

    it('should handle edge of dinner time (6 PM)', async () => {
      vi.setSystemTime(new Date(2024, 6, 15, 18, 0, 0));
      
      const result = await calculateContextualFactors('venue-123');
      
      expect(result).toBe(0.1); // Dinner time starts at 18
    });

    it('should handle edge of lunch time (11 AM)', async () => {
      vi.setSystemTime(new Date(2024, 6, 15, 11, 0, 0));
      
      const result = await calculateContextualFactors('venue-123');
      
      expect(result).toBe(0.05); // Lunch time starts at 11
    });

    it('should handle edge of lunch time end (2 PM)', async () => {
      vi.setSystemTime(new Date(2024, 6, 15, 14, 0, 0));
      
      const result = await calculateContextualFactors('venue-123');
      
      expect(result).toBe(0.05); // Lunch time ends at 14
    });
  });

  describe('calculateConfidenceLevel', () => {
    it('should return base confidence from AI score', () => {
      const result = calculateConfidenceLevel(70, {});
      
      expect(result).toBe(0.7);
    });

    it('should boost confidence with matching factors', () => {
      const result = calculateConfidenceLevel(50, {
        cuisine: true,
        price: true
      });
      
      // Base: 0.5 + (2 matches * 0.1) = 0.7
      expect(result).toBe(0.7);
    });

    it('should cap confidence at 0.95', () => {
      const result = calculateConfidenceLevel(100, {
        cuisine: true,
        price: true,
        vibe: true,
        rating: true
      });
      
      // Would be 1.0 + 0.4 = 1.4, but capped at 0.95
      expect(result).toBe(0.95);
    });

    it('should handle null match factors', () => {
      const result = calculateConfidenceLevel(60, null);
      
      expect(result).toBe(0.6);
    });

    it('should handle undefined match factors', () => {
      const result = calculateConfidenceLevel(60, undefined);
      
      expect(result).toBe(0.6);
    });

    it('should handle empty object match factors', () => {
      const result = calculateConfidenceLevel(80, {});
      
      expect(result).toBe(0.8);
    });

    it('should only count truthy values in match factors', () => {
      const result = calculateConfidenceLevel(50, {
        cuisine: true,
        price: false,
        vibe: null,
        rating: undefined
      });
      
      // Base: 0.5 + (1 match * 0.1) = 0.6
      expect(result).toBe(0.6);
    });

    it('should handle low AI score', () => {
      const result = calculateConfidenceLevel(30, {});
      
      expect(result).toBe(0.3);
    });

    it('should handle high AI score without matches', () => {
      const result = calculateConfidenceLevel(90, {});
      
      expect(result).toBe(0.9);
    });
  });
});
