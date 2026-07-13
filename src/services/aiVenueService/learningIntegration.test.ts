import { describe, it, expect, vi } from 'vitest';
import { getConfidenceBoost, applyWeight } from './learningIntegration';

// Mock the supabase client to prevent actual DB calls
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('learningIntegration', () => {
  describe('getConfidenceBoost', () => {
    it('should return 0 when no learning data exists', () => {
      const result = getConfidenceBoost({
        weights: { cuisine: 1, vibe: 1, price: 1, time: 1, rating: 1 },
        aiAccuracy: 0,
        totalRatings: 0,
        hasLearningData: false
      });
      
      expect(result).toBe(0);
    });

    it('should return ratings-only boost when AI accuracy is below the 60% threshold', () => {
      const result = getConfidenceBoost({
        weights: { cuisine: 1, vibe: 1, price: 1, time: 1, rating: 1 },
        aiAccuracy: 55, // below 60% → no accuracy boost
        totalRatings: 5,
        hasLearningData: true
      });

      // Accuracy boost: none (below 60%)
      // Ratings boost (first 5): 5 * 0.012 = 0.06
      expect(result).toBeCloseTo(0.06, 3);
    });

    it('should return combined boost when AI accuracy exceeds the threshold', () => {
      const result = getConfidenceBoost({
        weights: { cuisine: 1, vibe: 1, price: 1, time: 1, rating: 1 },
        aiAccuracy: 85,
        totalRatings: 10,
        hasLearningData: true
      });

      // Accuracy boost: (85 - 60) * 0.004 = 0.1
      // Ratings boost: 0.06 + min(5 * 0.004, 0.02) = 0.08
      // Total: 0.1 + 0.08 = 0.18
      expect(result).toBeCloseTo(0.18, 3);
    });

    it('should cap ratings boost at 0.08', () => {
      const result = getConfidenceBoost({
        weights: { cuisine: 1, vibe: 1, price: 1, time: 1, rating: 1 },
        aiAccuracy: 50, // Below 60%, no accuracy boost
        totalRatings: 20, // ratings boost is capped at 0.08
        hasLearningData: true
      });

      expect(result).toBeCloseTo(0.08, 3);
    });

    it('should calculate maximum boost with perfect accuracy', () => {
      const result = getConfidenceBoost({
        weights: { cuisine: 1, vibe: 1, price: 1, time: 1, rating: 1 },
        aiAccuracy: 100,
        totalRatings: 10,
        hasLearningData: true
      });

      // Accuracy boost: (100 - 60) * 0.004 = 0.16
      // Ratings boost: 0.06 + min(5 * 0.004, 0.02) = 0.08
      // Total: 0.16 + 0.08 = 0.24
      expect(result).toBeCloseTo(0.24, 3);
    });

    it('should handle edge case at exactly the 60% accuracy threshold', () => {
      const result = getConfidenceBoost({
        weights: { cuisine: 1, vibe: 1, price: 1, time: 1, rating: 1 },
        aiAccuracy: 60,
        totalRatings: 2,
        hasLearningData: true
      });

      // Accuracy boost: (60 - 60) * 0.004 = 0 (strictly greater than needed)
      // Ratings boost (first 5): 2 * 0.012 = 0.024
      expect(result).toBeCloseTo(0.024, 3);
    });
  });

  describe('applyWeight', () => {
    it('should return unchanged value with neutral weight of 1.0', () => {
      const result = applyWeight(0.25, 1.0, 'cuisine');
      expect(result).toBe(0.25);
    });

    it('should double the value with weight of 2.0', () => {
      const result = applyWeight(0.25, 2.0, 'vibe');
      expect(result).toBe(0.5);
    });

    it('should halve the value with weight of 0.5', () => {
      const result = applyWeight(0.25, 0.5, 'price');
      expect(result).toBe(0.125);
    });

    it('should return 0 when base value is 0', () => {
      const result = applyWeight(0, 1.5, 'time');
      expect(result).toBe(0);
    });

    it('should handle negative base values', () => {
      const result = applyWeight(-0.1, 1.0, 'rating');
      expect(result).toBe(-0.1);
    });

    it('should apply fractional weights correctly', () => {
      const result = applyWeight(0.4, 1.25, 'cuisine');
      expect(result).toBe(0.5);
    });
  });
});
