import { describe, it, expect, vi, beforeEach } from 'vitest';
import { filterVenuesByPreferences, filterVenuesByCollaborativePreferences } from './preferenceFiltering';

// Mock the supabase client
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => mockFrom()
  }
}));

describe('preferenceFiltering', () => {
  const mockVenues = [
    {
      id: 'venue-1',
      name: 'Italian Bistro',
      cuisine_type: 'Italian',
      price_range: '$$',
      tags: ['casual', 'family-friendly']
    },
    {
      id: 'venue-2',
      name: 'French Fine Dining',
      cuisine_type: 'French',
      price_range: '$$$',
      tags: ['romantic', 'elegant']
    },
    {
      id: 'venue-3',
      name: 'Sushi Bar',
      cuisine_type: 'Japanese',
      price_range: '$$',
      tags: ['casual', 'modern']
    },
    {
      id: 'venue-4',
      name: 'Vegan Cafe',
      cuisine_type: 'Vegan',
      price_range: '$',
      tags: ['vegetarian', 'healthy']
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('filterVenuesByPreferences', () => {
    it('should return all venues when no preferences found', async () => {
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Not found' } });
      
      const result = await filterVenuesByPreferences('user-123', mockVenues);
      
      expect(result).toEqual(mockVenues);
    });

    it('should filter venues by cuisine preference', async () => {
      mockSingle.mockResolvedValue({
        data: {
          preferred_cuisines: ['Italian'],
          preferred_price_range: null,
          preferred_vibes: null,
          dietary_restrictions: []
        },
        error: null
      });
      
      const result = await filterVenuesByPreferences('user-123', mockVenues);
      
      // Italian Bistro should have highest score
      expect(result[0].name).toBe('Italian Bistro');
      expect(result[0].preferenceScore).toBeGreaterThan(40);
    });

    it('should filter venues by price range preference', async () => {
      mockSingle.mockResolvedValue({
        data: {
          preferred_cuisines: null,
          preferred_price_range: ['$$$'],
          preferred_vibes: null,
          dietary_restrictions: []
        },
        error: null
      });
      
      const result = await filterVenuesByPreferences('user-123', mockVenues);
      
      // French Fine Dining should rank highest for $$$ price
      const frenchVenue = result.find(v => v.name === 'French Fine Dining');
      expect(frenchVenue).toBeDefined();
      expect(frenchVenue?.preferenceScore).toBeGreaterThanOrEqual(30);
    });

    it('should filter venues by vibe/tag preferences', async () => {
      mockSingle.mockResolvedValue({
        data: {
          preferred_cuisines: null,
          preferred_price_range: null,
          preferred_vibes: ['romantic'],
          dietary_restrictions: []
        },
        error: null
      });
      
      const result = await filterVenuesByPreferences('user-123', mockVenues);
      
      // French Fine Dining has 'romantic' tag
      const romanticVenue = result.find(v => v.name === 'French Fine Dining');
      expect(romanticVenue).toBeDefined();
    });

    it('should preserve venue_id in scored venues', async () => {
      mockSingle.mockResolvedValue({
        data: {
          preferred_cuisines: ['Italian'],
          preferred_price_range: ['$$'],
          preferred_vibes: ['casual'],
          dietary_restrictions: []
        },
        error: null
      });
      
      const result = await filterVenuesByPreferences('user-123', mockVenues);
      
      // All venues should have their original id preserved
      result.forEach(venue => {
        expect(venue.id || venue.venue_id).toBeDefined();
      });
    });

    it('should only return venues with at least 25% match', async () => {
      mockSingle.mockResolvedValue({
        data: {
          preferred_cuisines: ['Thai'],
          preferred_price_range: ['$$$$'],
          preferred_vibes: ['outdoor'],
          dietary_restrictions: []
        },
        error: null
      });
      
      const result = await filterVenuesByPreferences('user-123', mockVenues);
      
      // All returned venues should have at least 25% score
      result.forEach(venue => {
        expect(venue.preferenceScore).toBeGreaterThanOrEqual(25);
      });
    });

    it('should score venues with multiple matching criteria', async () => {
      mockSingle.mockResolvedValue({
        data: {
          preferred_cuisines: ['Italian'],
          preferred_price_range: ['$$'],
          preferred_vibes: ['casual'],
          dietary_restrictions: []
        },
        error: null
      });
      
      const result = await filterVenuesByPreferences('user-123', mockVenues);
      
      // Italian Bistro matches cuisine, price, and vibe - should be top
      expect(result[0].name).toBe('Italian Bistro');
      expect(result[0].preferenceScore).toBeGreaterThan(80);
    });

    it('should handle empty venues array', async () => {
      mockSingle.mockResolvedValue({
        data: {
          preferred_cuisines: ['Italian'],
          preferred_price_range: ['$$'],
          preferred_vibes: null,
          dietary_restrictions: []
        },
        error: null
      });
      
      const result = await filterVenuesByPreferences('user-123', []);
      
      expect(result).toEqual([]);
    });
  });

  describe('filterVenuesByCollaborativePreferences', () => {
    it('should fall back to single user filter when partner prefs missing', async () => {
      // First call returns user prefs, second call returns null for partner
      mockSingle
        .mockResolvedValueOnce({
          data: {
            preferred_cuisines: ['Italian'],
            preferred_price_range: ['$$'],
            preferred_vibes: null,
            dietary_restrictions: []
          },
          error: null
        })
        .mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })
        // Third call for fallback single user filter
        .mockResolvedValueOnce({
          data: {
            preferred_cuisines: ['Italian'],
            preferred_price_range: ['$$'],
            preferred_vibes: null,
            dietary_restrictions: []
          },
          error: null
        });
      
      const result = await filterVenuesByCollaborativePreferences('user-1', 'partner-1', mockVenues);
      
      // Should still return filtered results
      expect(result.length).toBeGreaterThan(0);
    });

    it('should heavily weight shared cuisine matches', async () => {
      // Both users prefer Italian
      mockSingle
        .mockResolvedValueOnce({
          data: {
            preferred_cuisines: ['Italian'],
            preferred_price_range: ['$$'],
            preferred_vibes: ['casual'],
            dietary_restrictions: []
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            preferred_cuisines: ['Italian'],
            preferred_price_range: ['$$'],
            preferred_vibes: ['casual'],
            dietary_restrictions: []
          },
          error: null
        });
      
      const result = await filterVenuesByCollaborativePreferences('user-1', 'partner-1', mockVenues);
      
      // Italian Bistro should be top because both users like Italian
      expect(result[0].name).toBe('Italian Bistro');
      expect(result[0].sharedScore).toBeGreaterThan(0);
    });

    it('should heavily weight shared price matches', async () => {
      // Both users prefer $$$
      mockSingle
        .mockResolvedValueOnce({
          data: {
            preferred_cuisines: null,
            preferred_price_range: ['$$$'],
            preferred_vibes: null,
            dietary_restrictions: []
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            preferred_cuisines: null,
            preferred_price_range: ['$$$'],
            preferred_vibes: null,
            dietary_restrictions: []
          },
          error: null
        });
      
      const result = await filterVenuesByCollaborativePreferences('user-1', 'partner-1', mockVenues);
      
      // French Fine Dining should rank high because both prefer $$$
      const frenchVenue = result.find(v => v.name === 'French Fine Dining');
      expect(frenchVenue).toBeDefined();
      expect(frenchVenue?.sharedScore).toBeGreaterThanOrEqual(30);
    });

    it('should calculate collaborative score correctly', async () => {
      // Users have different preferences
      mockSingle
        .mockResolvedValueOnce({
          data: {
            preferred_cuisines: ['Italian'],
            preferred_price_range: ['$$'],
            preferred_vibes: ['casual'],
            dietary_restrictions: []
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            preferred_cuisines: ['French'],
            preferred_price_range: ['$$$'],
            preferred_vibes: ['romantic'],
            dietary_restrictions: []
          },
          error: null
        });
      
      const result = await filterVenuesByCollaborativePreferences('user-1', 'partner-1', mockVenues);
      
      // Each venue should have individual and collaborative scores
      result.forEach(venue => {
        expect(venue).toHaveProperty('collaborativeScore');
        expect(venue).toHaveProperty('userScore');
        expect(venue).toHaveProperty('partnerScore');
        expect(venue).toHaveProperty('sharedScore');
      });
    });

    it('should return venues with minimum 20% collaborative threshold', async () => {
      mockSingle
        .mockResolvedValueOnce({
          data: {
            preferred_cuisines: ['Thai'],
            preferred_price_range: ['$$$$'],
            preferred_vibes: ['outdoor'],
            dietary_restrictions: []
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            preferred_cuisines: ['Mexican'],
            preferred_price_range: ['$'],
            preferred_vibes: ['party'],
            dietary_restrictions: []
          },
          error: null
        });
      
      const result = await filterVenuesByCollaborativePreferences('user-1', 'partner-1', mockVenues);
      
      // All returned venues should have at least 20% collaborative score
      result.forEach(venue => {
        expect(venue.collaborativeScore).toBeGreaterThanOrEqual(20);
      });
    });

    it('should preserve venue_id in collaborative scored venues', async () => {
      mockSingle
        .mockResolvedValueOnce({
          data: {
            preferred_cuisines: ['Italian'],
            preferred_price_range: ['$$'],
            preferred_vibes: null,
            dietary_restrictions: []
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            preferred_cuisines: ['Italian'],
            preferred_price_range: ['$$'],
            preferred_vibes: null,
            dietary_restrictions: []
          },
          error: null
        });
      
      const result = await filterVenuesByCollaborativePreferences('user-1', 'partner-1', mockVenues);
      
      // All venues should preserve their ID
      result.forEach(venue => {
        expect(venue.id || venue.venue_id).toBeDefined();
      });
    });

    it('should handle shared vibe preferences', async () => {
      // Both users like casual vibes
      mockSingle
        .mockResolvedValueOnce({
          data: {
            preferred_cuisines: null,
            preferred_price_range: null,
            preferred_vibes: ['casual'],
            dietary_restrictions: []
          },
          error: null
        })
        .mockResolvedValueOnce({
          data: {
            preferred_cuisines: null,
            preferred_price_range: null,
            preferred_vibes: ['casual'],
            dietary_restrictions: []
          },
          error: null
        });
      
      const result = await filterVenuesByCollaborativePreferences('user-1', 'partner-1', mockVenues);
      
      // Venues with casual tag should have shared vibe bonus
      const casualVenues = result.filter(v => v.tags?.includes('casual'));
      casualVenues.forEach(venue => {
        expect(venue.sharedScore).toBeGreaterThanOrEqual(20);
      });
    });
  });
});
