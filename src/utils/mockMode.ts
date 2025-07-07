
// Toggle this to enable/disable mock mode
export const IS_MOCK_MODE = true;

// Mock user data
export const MOCK_USER = {
  id: 'mock-user-123',
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: null
};

// Mock venue recommendations for testing
export const MOCK_VENUE_RECOMMENDATIONS = [
  {
    venue_id: 'venue-1',
    venue_name: 'Bella Notte',
    venue_address: '123 Main St, Downtown',
    venue_image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
    ai_score: 95,
    match_factors: {
      cuisine_match: true,
      price_match: true,
      vibe_matches: ['romantic', 'intimate'],
      rating_bonus: 0.15
    },
    contextual_score: 0.1,
    ai_reasoning: 'Perfect match for romantic evening with Italian cuisine preferences and upscale dining experience',
    confidence_level: 0.92
  },
  {
    venue_id: 'venue-2',
    venue_name: 'Sakura Sushi',
    venue_address: '456 Oak Ave, Arts District',
    venue_image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop',
    ai_score: 88,
    match_factors: {
      cuisine_match: true,
      price_match: true,
      vibe_matches: ['modern', 'casual'],
      rating_bonus: 0.11
    },
    contextual_score: 0.05,
    ai_reasoning: 'Great match for Japanese cuisine lovers with modern atmosphere preferences',
    confidence_level: 0.85
  },
  {
    venue_id: 'venue-3',
    venue_name: 'Taco Libre',
    venue_address: '789 Pine St, Mission District',
    venue_image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    ai_score: 82,
    match_factors: {
      cuisine_match: false,
      price_match: true,
      vibe_matches: ['lively', 'casual'],
      rating_bonus: 0.09
    },
    contextual_score: 0.08,
    ai_reasoning: 'Good option for casual dining with vibrant atmosphere and reasonable prices',
    confidence_level: 0.78
  }
];

// Mock compatibility score
export const MOCK_COMPATIBILITY_SCORE = 87;

// Helper function to get mock venue recommendations
export const getMockVenueRecommendations = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_VENUE_RECOMMENDATIONS);
    }, 2000); // Simulate API delay
  });
};

// Helper function to get mock compatibility score
export const getMockCompatibilityScore = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_COMPATIBILITY_SCORE);
    }, 1500); // Simulate API delay
  });
};
