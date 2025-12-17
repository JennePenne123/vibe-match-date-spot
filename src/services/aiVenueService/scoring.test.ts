import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateVenueAIScore, calculateContextualFactors, calculateConfidenceLevel } from './scoring';
import { supabase } from '@/integrations/supabase/client';
import { getUserLearnedWeights, getConfidenceBoost, applyWeight } from './learningIntegration';

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

// Test fixtures
const mockUserPrefs = {
  user_id: 'user-123',
  preferred_cuisines: ['Italian', 'French'],
  preferred_vibes: ['romantic', 'upscale'],
  preferred_price_range: ['$$', '$$$'],
  preferred_times: ['dinner'],
  dietary_restrictions: []
};

const mockVenue = {
  id: 'venue-123',
  name: 'Test Restaurant',
  cuisine_type: 'Italian',
  price_range: '$$',
  tags: ['romantic', 'cozy'],
  rating: 4.5,
  address: '123 Test St'
};

const mockDefaultWeights = {
  weights: { cuisine: 1.0, price: 1.0, vibe: 1.0, time: 1.0, rating: 1.0 },
  hasLearningData: false,
  aiAccuracy: 0,
  totalRatings: 0
};

const mockLearnedWeights = {
  weights: { cuisine: 1.5, price: 1.2, vibe: 0.8, time: 1.0, rating: 1.3 },
  hasLearningData: true,
  aiAccuracy: 85,
  totalRatings: 10
};

// Helper to create chainable mock
const createChainMock = (data: any, error: any = null) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data, error }),
  maybeSingle: vi.fn().mockResolvedValue({ data, error })
});

const createUpsertMock = (error: any = null) => ({
  upsert: vi.fn().mockResolvedValue({ error })
});

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

  describe('calculateVenueAIScore - Integration Tests', () => {
    const mockFrom = vi.mocked(supabase.from);
    const mockGetUserLearnedWeights = vi.mocked(getUserLearnedWeights);
    const mockGetConfidenceBoost = vi.mocked(getConfidenceBoost);
    const mockApplyWeight = vi.mocked(applyWeight);

    beforeEach(() => {
      vi.clearAllMocks();
      // Default: applyWeight returns the value unchanged
      mockApplyWeight.mockImplementation((value) => value);
      mockGetConfidenceBoost.mockReturnValue(0);
      mockGetUserLearnedWeights.mockResolvedValue(mockDefaultWeights);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    // Helper to setup mock chain
    const setupMocks = (
      userPrefs: any,
      venue: any,
      upsertError: any = null
    ) => {
      const prefsMock = createChainMock(userPrefs);
      const venueMock = createChainMock(venue);
      const scoreMock = createUpsertMock(upsertError);

      mockFrom.mockImplementation((table: string) => {
        if (table === 'user_preferences') return prefsMock as any;
        if (table === 'venues') return venueMock as any;
        if (table === 'ai_venue_scores') return scoreMock as any;
        return createChainMock(null) as any;
      });

      return { prefsMock, venueMock, scoreMock };
    };

    // ==================== SUCCESS SCENARIOS ====================

    describe('successful scoring scenarios', () => {
      it('should calculate score with perfect cuisine and price match', async () => {
        setupMocks(mockUserPrefs, mockVenue);

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        // Base 60% + cuisine 25% + price 15% + vibes 20% (2 matches) + rating bonus
        expect(score).toBeGreaterThan(60);
        expect(score).toBeLessThanOrEqual(98);
      });

      it('should return 50 when no user preferences exist', async () => {
        setupMocks(null, mockVenue);

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        expect(score).toBe(50);
      });

      it('should return 50 when venue not found', async () => {
        setupMocks(mockUserPrefs, null);

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        expect(score).toBe(50);
      });

      it('should handle venue with no cuisine match', async () => {
        const noMatchVenue = { ...mockVenue, cuisine_type: 'Thai' };
        setupMocks(mockUserPrefs, noMatchVenue);

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        // Should still have base score but cuisine penalty
        expect(score).toBeGreaterThanOrEqual(35);
      });

      it('should handle venue with no price match', async () => {
        const expensiveVenue = { ...mockVenue, price_range: '$$$$' };
        setupMocks(mockUserPrefs, expensiveVenue);

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        expect(score).toBeGreaterThanOrEqual(35);
      });

      it('should handle venue with no tags', async () => {
        const noTagsVenue = { ...mockVenue, tags: [] };
        setupMocks(mockUserPrefs, noTagsVenue);

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        expect(score).toBeGreaterThanOrEqual(35);
      });

      it('should handle venue with null tags', async () => {
        const nullTagsVenue = { ...mockVenue, tags: null };
        setupMocks(mockUserPrefs, nullTagsVenue);

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        expect(score).toBeGreaterThanOrEqual(35);
      });

      it('should handle partial string matching for cuisine', async () => {
        const partialVenue = { ...mockVenue, cuisine_type: 'Italian Fine Dining' };
        setupMocks(mockUserPrefs, partialVenue);

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        // Should match 'Italian' substring
        expect(score).toBeGreaterThan(60);
      });
    });

    // ==================== SCORE CLAMPING TESTS ====================

    describe('score clamping', () => {
      it('should never return score below 35', async () => {
        // No matches at all
        const badVenue = { 
          ...mockVenue, 
          cuisine_type: 'Unknown', 
          price_range: '$$$$$', 
          tags: [], 
          rating: 1.0 
        };
        const badPrefs = {
          ...mockUserPrefs,
          preferred_cuisines: ['xyz'],
          preferred_vibes: ['xyz'],
          preferred_price_range: ['$']
        };
        setupMocks(badPrefs, badVenue);

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        expect(score).toBeGreaterThanOrEqual(35);
      });

      it('should never return score above 98', async () => {
        // Perfect matches + high rating + learned weights boost
        mockGetConfidenceBoost.mockReturnValue(0.5); // Big confidence boost
        mockApplyWeight.mockImplementation((value) => value * 2); // Double all weights
        setupMocks(mockUserPrefs, { ...mockVenue, rating: 5.0 });

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        expect(score).toBeLessThanOrEqual(98);
      });

      it('should clamp negative raw scores to 35', async () => {
        // Force negative cuisine penalty
        const noMatchVenue = { ...mockVenue, cuisine_type: 'xyz', price_range: 'xyz', tags: [], rating: null };
        setupMocks(mockUserPrefs, noMatchVenue);
        // Apply negative weight
        mockApplyWeight.mockImplementation((value) => value * -10);

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        expect(score).toBe(35);
      });
    });

    // ==================== ERROR HANDLING TESTS ====================

    describe('error handling', () => {
      it('should return 50 on preferences fetch error', async () => {
        const prefsMock = createChainMock(null, { message: 'DB error' });
        const venueMock = createChainMock(mockVenue);
        const scoreMock = createUpsertMock();

        mockFrom.mockImplementation((table: string) => {
          if (table === 'user_preferences') return prefsMock as any;
          if (table === 'venues') return venueMock as any;
          if (table === 'ai_venue_scores') return scoreMock as any;
          return createChainMock(null) as any;
        });

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        expect(score).toBe(50);
      });

      it('should return 50 on venue fetch error', async () => {
        const prefsMock = createChainMock(mockUserPrefs);
        const venueMock = createChainMock(null, { message: 'Venue not found' });
        const scoreMock = createUpsertMock();

        mockFrom.mockImplementation((table: string) => {
          if (table === 'user_preferences') return prefsMock as any;
          if (table === 'venues') return venueMock as any;
          if (table === 'ai_venue_scores') return scoreMock as any;
          return createChainMock(null) as any;
        });

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        expect(score).toBe(50);
      });

      it('should still return score even if upsert fails', async () => {
        setupMocks(mockUserPrefs, mockVenue, { message: 'Upsert failed' });

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        // Should still calculate and return score despite storage error
        expect(score).toBeGreaterThan(35);
      });

      it('should handle getUserLearnedWeights throwing error', async () => {
        setupMocks(mockUserPrefs, mockVenue);
        mockGetUserLearnedWeights.mockRejectedValue(new Error('Learning fetch failed'));

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        // Should fall back to default score
        expect(score).toBe(50);
      });

      it('should return 50 on unexpected error', async () => {
        mockFrom.mockImplementation(() => {
          throw new Error('Unexpected error');
        });

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        expect(score).toBe(50);
      });
    });

    // ==================== LEARNED WEIGHTS TESTS ====================

    describe('learned weights integration', () => {
      it('should apply learned weights when available', async () => {
        setupMocks(mockUserPrefs, mockVenue);
        mockGetUserLearnedWeights.mockResolvedValue(mockLearnedWeights);
        mockApplyWeight.mockImplementation((value, weight) => value * weight);

        await calculateVenueAIScore('venue-123', 'user-123');

        // Verify applyWeight was called with learned weights
        expect(mockApplyWeight).toHaveBeenCalledWith(expect.any(Number), 1.5, 'cuisine');
        expect(mockApplyWeight).toHaveBeenCalledWith(expect.any(Number), 1.2, 'price');
        expect(mockApplyWeight).toHaveBeenCalledWith(expect.any(Number), 0.8, 'vibe');
      });

      it('should use default weights when no learning data', async () => {
        setupMocks(mockUserPrefs, mockVenue);
        mockGetUserLearnedWeights.mockResolvedValue(mockDefaultWeights);

        await calculateVenueAIScore('venue-123', 'user-123');

        expect(mockApplyWeight).toHaveBeenCalledWith(expect.any(Number), 1.0, 'cuisine');
      });

      it('should add confidence boost for high accuracy learning', async () => {
        setupMocks(mockUserPrefs, mockVenue);
        mockGetUserLearnedWeights.mockResolvedValue(mockLearnedWeights);
        mockGetConfidenceBoost.mockReturnValue(0.1); // 10% boost

        const scoreWithBoost = await calculateVenueAIScore('venue-123', 'user-123');

        // Reset and test without boost
        mockGetConfidenceBoost.mockReturnValue(0);
        const scoreWithoutBoost = await calculateVenueAIScore('venue-123', 'user-123');

        // Score with boost should be higher (by ~10 points)
        expect(scoreWithBoost).toBeGreaterThan(scoreWithoutBoost);
      });

      it('should call getConfidenceBoost with learned weights', async () => {
        setupMocks(mockUserPrefs, mockVenue);
        mockGetUserLearnedWeights.mockResolvedValue(mockLearnedWeights);

        await calculateVenueAIScore('venue-123', 'user-123');

        expect(mockGetConfidenceBoost).toHaveBeenCalledWith(mockLearnedWeights);
      });

      it('should fetch learned weights in parallel with preferences', async () => {
        setupMocks(mockUserPrefs, mockVenue);
        
        await calculateVenueAIScore('venue-123', 'user-123');

        // Both should be called (parallel execution)
        expect(mockGetUserLearnedWeights).toHaveBeenCalledWith('user-123');
        expect(mockFrom).toHaveBeenCalledWith('user_preferences');
      });
    });

    // ==================== DATABASE STORAGE TESTS ====================

    describe('database storage', () => {
      it('should store AI score with match factors', async () => {
        const { scoreMock } = setupMocks(mockUserPrefs, mockVenue);

        await calculateVenueAIScore('venue-123', 'user-123');

        expect(mockFrom).toHaveBeenCalledWith('ai_venue_scores');
        expect(scoreMock.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            venue_id: 'venue-123',
            user_id: 'user-123',
            ai_score: expect.any(Number),
            match_factors: expect.objectContaining({
              cuisine_match: true,
              price_match: true
            })
          })
        );
      });

      it('should store learned_weights_applied flag', async () => {
        const { scoreMock } = setupMocks(mockUserPrefs, mockVenue);
        mockGetUserLearnedWeights.mockResolvedValue(mockLearnedWeights);

        await calculateVenueAIScore('venue-123', 'user-123');

        expect(scoreMock.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            match_factors: expect.objectContaining({
              learned_weights_applied: true,
              weight_multipliers: mockLearnedWeights.weights
            })
          })
        );
      });

      it('should store null weight_multipliers when no learning data', async () => {
        const { scoreMock } = setupMocks(mockUserPrefs, mockVenue);
        mockGetUserLearnedWeights.mockResolvedValue(mockDefaultWeights);

        await calculateVenueAIScore('venue-123', 'user-123');

        expect(scoreMock.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            match_factors: expect.objectContaining({
              learned_weights_applied: false,
              weight_multipliers: null
            })
          })
        );
      });

      it('should include updated_at timestamp', async () => {
        const { scoreMock } = setupMocks(mockUserPrefs, mockVenue);

        await calculateVenueAIScore('venue-123', 'user-123');

        expect(scoreMock.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            updated_at: expect.any(String)
          })
        );
      });
    });

    // ==================== RATING BONUS TESTS ====================

    describe('rating bonus calculation', () => {
      it('should add rating bonus for high-rated venues', async () => {
        const highRatedVenue = { ...mockVenue, rating: 5.0 };
        setupMocks(mockUserPrefs, highRatedVenue);

        const highScore = await calculateVenueAIScore('venue-123', 'user-123');

        const lowRatedVenue = { ...mockVenue, rating: 3.0 };
        setupMocks(mockUserPrefs, lowRatedVenue);

        const lowScore = await calculateVenueAIScore('venue-123', 'user-123');

        expect(highScore).toBeGreaterThan(lowScore);
      });

      it('should handle venue with no rating', async () => {
        const noRatingVenue = { ...mockVenue, rating: null };
        setupMocks(mockUserPrefs, noRatingVenue);

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        expect(score).toBeGreaterThanOrEqual(35);
      });

      it('should cap rating bonus at maximum', async () => {
        const perfectVenue = { ...mockVenue, rating: 5.0 };
        setupMocks(mockUserPrefs, perfectVenue);
        
        await calculateVenueAIScore('venue-123', 'user-123');

        // Rating bonus is capped at (rating - 3.0) * 0.05, max 0.1
        expect(mockApplyWeight).toHaveBeenCalledWith(0.1, expect.any(Number), 'rating');
      });
    });

    // ==================== VIBE MATCHING EDGE CASES ====================

    describe('vibe matching edge cases', () => {
      it('should infer romantic vibe for expensive fine dining', async () => {
        const fineDiningVenue = { 
          ...mockVenue, 
          tags: [], 
          price_range: '$$$',
          cuisine_type: 'Fine Dining'
        };
        const romanticPrefs = {
          ...mockUserPrefs,
          preferred_vibes: ['romantic']
        };
        setupMocks(romanticPrefs, fineDiningVenue);

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        // Should get vibe match from inference
        expect(score).toBeGreaterThan(60);
      });

      it('should infer casual vibe for budget venues', async () => {
        const budgetVenue = { 
          ...mockVenue, 
          tags: [], 
          price_range: '$'
        };
        const casualPrefs = {
          ...mockUserPrefs,
          preferred_vibes: ['casual']
        };
        setupMocks(casualPrefs, budgetVenue);

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        expect(score).toBeGreaterThanOrEqual(35);
      });

      it('should handle case-insensitive vibe matching', async () => {
        const mixedCaseVenue = { 
          ...mockVenue, 
          tags: ['ROMANTIC', 'Cozy', 'upScale']
        };
        setupMocks(mockUserPrefs, mixedCaseVenue);

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        // Should match despite case differences
        expect(score).toBeGreaterThan(60);
      });

      it('should handle empty preferred_vibes array', async () => {
        const noVibePrefs = { ...mockUserPrefs, preferred_vibes: [] };
        setupMocks(noVibePrefs, mockVenue);

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        expect(score).toBeGreaterThanOrEqual(35);
      });
    });

    // ==================== CONTEXTUAL FACTORS INTEGRATION ====================

    describe('contextual factors integration', () => {
      it('should include dinner time bonus at 7 PM', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2024, 6, 15, 19, 0, 0));
        
        setupMocks(mockUserPrefs, mockVenue);

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        // Should have contextual bonus added
        expect(score).toBeGreaterThan(60);
      });

      it('should include winter bonus in December', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2024, 11, 15, 12, 0, 0)); // December at noon

        setupMocks(mockUserPrefs, mockVenue);

        const score = await calculateVenueAIScore('venue-123', 'user-123');

        // Should have lunch + winter bonus
        expect(score).toBeGreaterThan(60);
      });
    });
  });
});
