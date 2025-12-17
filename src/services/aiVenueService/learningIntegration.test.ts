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

    it('should return small boost from ratings only when AI accuracy is below 70%', () => {
      const result = getConfidenceBoost({
        weights: { cuisine: 1, vibe: 1, price: 1, time: 1, rating: 1 },
        aiAccuracy: 65,
        totalRatings: 5,
        hasLearningData: true
      });
      
      // Only ratings bonus: 5 * 0.005 = 0.025
      expect(result).toBeCloseTo(0.025, 3);
    });

    it('should return combined boost when AI accuracy exceeds 70%', () => {
      const result = getConfidenceBoost({
        weights: { cuisine: 1, vibe: 1, price: 1, time: 1, rating: 1 },
        aiAccuracy: 85,
        totalRatings: 10,
        hasLearningData: true
      });
      
      // Accuracy boost: (85 - 70) * 0.003 = 0.045
      // Ratings boost: 10 * 0.005 = 0.05, capped at 0.03
      // Total: 0.045 + 0.03 = 0.075
      expect(result).toBeCloseTo(0.075, 3);
    });

    it('should cap ratings boost at 0.03', () => {
      const result = getConfidenceBoost({
        weights: { cuisine: 1, vibe: 1, price: 1, time: 1, rating: 1 },
        aiAccuracy: 50, // Below 70%, no accuracy boost
        totalRatings: 20, // 20 * 0.005 = 0.1, but capped at 0.03
        hasLearningData: true
      });
      
      expect(result).toBeCloseTo(0.03, 3);
    });

    it('should calculate maximum boost with perfect accuracy', () => {
      const result = getConfidenceBoost({
        weights: { cuisine: 1, vibe: 1, price: 1, time: 1, rating: 1 },
        aiAccuracy: 100,
        totalRatings: 10,
        hasLearningData: true
      });
      
      // Accuracy boost: (100 - 70) * 0.003 = 0.09
      // Ratings boost: capped at 0.03
      // Total: 0.09 + 0.03 = 0.12
      expect(result).toBeCloseTo(0.12, 3);
    });

    it('should handle edge case of exactly 70% accuracy', () => {
      const result = getConfidenceBoost({
        weights: { cuisine: 1, vibe: 1, price: 1, time: 1, rating: 1 },
        aiAccuracy: 70,
        totalRatings: 2,
        hasLearningData: true
      });
      
      // Accuracy boost: (70 - 70) * 0.003 = 0
      // Ratings boost: 2 * 0.005 = 0.01
      expect(result).toBeCloseTo(0.01, 3);
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
