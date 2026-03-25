import { supabase } from '@/integrations/supabase/client';
import type { VenueSwipeData } from '@/components/onboarding/VenueSwipeCards';

/**
 * Converts explicit user preference selections into initial AI feature weights.
 * Solves the cold-start problem by bootstrapping user_preference_vectors
 * from the preferences chosen during onboarding — no extra UI step needed.
 */

interface PreferenceSelections {
  cuisines: string[];
  vibes: string[];
  priceRange: string[];
  times: string[];
  dietary: string[];
  activities?: string[];
  venueTypes?: string[];
  swipeData?: VenueSwipeData;
  distanceKm?: number;
}

// Maps preference diversity to weight emphasis.
const calculateCategoryWeight = (selectedCount: number, totalOptions: number): number => {
  if (selectedCount === 0) return 1.0;
  const selectivity = 1 - (selectedCount / totalOptions);
  return 0.8 + selectivity * 0.6;
};

/**
 * Calculates initial distance weight from slider value.
 * Low distance → high weight (proximity matters a lot)
 * High distance → low weight (user doesn't mind traveling)
 */
const calculateDistanceWeight = (distanceKm?: number): number => {
  if (!distanceKm) return 1.0;
  if (distanceKm <= 3) return 1.5;   // Very proximity-focused
  if (distanceKm <= 5) return 1.2;   // Moderately proximity-focused
  if (distanceKm <= 10) return 1.0;  // Neutral
  if (distanceKm <= 15) return 0.8;  // Happy to travel
  return 0.6;                         // Distance doesn't matter much
};

// Derive initial cuisine vector from selections
const buildCuisineVector = (cuisines: string[]): number[] => {
  const allCuisines = ['italian', 'japanese', 'turkish', 'mexican', 'french', 'indian', 'greek', 'vietnamese', 'mediterranean', 'american', 'thai', 'chinese', 'korean', 'spanish', 'german'];
  return allCuisines.map(c => cuisines.includes(c) ? 1.0 : 0.2);
};

const buildVibeVector = (vibes: string[]): number[] => {
  const allVibes = ['romantic', 'casual', 'outdoor', 'nightlife', 'cultural', 'adventurous'];
  return allVibes.map(v => vibes.includes(v) ? 1.0 : 0.2);
};

const buildPriceVector = (priceRange: string[]): number[] => {
  const allPrices = ['budget', 'moderate', 'upscale', 'luxury'];
  return allPrices.map(p => priceRange.includes(p) ? 1.0 : 0.2);
};

const buildTimeVector = (times: string[]): number[] => {
  const allTimes = ['brunch', 'lunch', 'afternoon', 'dinner', 'evening', 'flexible'];
  return allTimes.map(t => times.includes(t) ? 1.0 : 0.2);
};

/**
 * Calculates a swipe confidence boost.
 * If the user swiped all 6 cards, we're more confident about their preferences.
 */
const getSwipeConfidence = (swipeData?: VenueSwipeData): number => {
  if (!swipeData) return 0;
  const totalSwiped = swipeData.liked.length + swipeData.disliked.length;
  return Math.min(totalSwiped / 6, 1.0); // 0..1
};

export const initializePreferenceVectors = async (
  userId: string,
  preferences: PreferenceSelections
): Promise<boolean> => {
  try {
    console.log('🚀 COLD-START: Initializing preference vectors from onboarding selections');

    const swipeConfidence = getSwipeConfidence(preferences.swipeData);

    // Calculate feature weights based on selection patterns
    const featureWeights: Record<string, number> = {
      cuisine: calculateCategoryWeight(preferences.cuisines.length, 15),
      vibe: calculateCategoryWeight(preferences.vibes.length, 6),
      price: calculateCategoryWeight(preferences.priceRange.length, 4),
      time: calculateCategoryWeight(preferences.times.length, 6),
      rating: 1.0,
      distance: calculateDistanceWeight(preferences.distanceKm),
    };

    // Boost weights if swipe data confirms the same preferences
    if (swipeConfidence > 0.5) {
      // User engaged with swipe cards → we're more confident about cuisine/vibe weights
      featureWeights.cuisine = Math.min(2.0, featureWeights.cuisine * (1 + swipeConfidence * 0.2));
      featureWeights.vibe = Math.min(2.0, featureWeights.vibe * (1 + swipeConfidence * 0.15));
      console.log(`🎯 COLD-START: Swipe confidence ${(swipeConfidence * 100).toFixed(0)}% → boosted cuisine/vibe weights`);
    }

    // Build preference vectors
    const cuisineVector = buildCuisineVector(preferences.cuisines);
    const vibeVector = buildVibeVector(preferences.vibes);
    const priceVector = buildPriceVector(preferences.priceRange);
    const timeVector = buildTimeVector(preferences.times);

    // Store learning metadata
    const learningData = {
      initialized_from: 'onboarding',
      initialized_at: new Date().toISOString(),
      initial_selections: {
        cuisines: preferences.cuisines,
        vibes: preferences.vibes,
        priceRange: preferences.priceRange,
        times: preferences.times,
        dietary: preferences.dietary,
        activities: preferences.activities || [],
        venueTypes: preferences.venueTypes || [],
      },
      swipe_data: preferences.swipeData ? {
        liked: preferences.swipeData.liked,
        disliked: preferences.swipeData.disliked,
        total_swiped: preferences.swipeData.liked.length + preferences.swipeData.disliked.length,
        swipe_confidence: swipeConfidence,
      } : null,
      initial_distance_km: preferences.distanceKm || null,
    };

    const { error } = await supabase
      .from('user_preference_vectors')
      .upsert({
        user_id: userId,
        feature_weights: featureWeights,
        cuisine_vector: cuisineVector,
        vibe_vector: vibeVector,
        price_vector: priceVector,
        time_vector: timeVector,
        learning_data: learningData,
        ai_accuracy: 0,
        total_ratings: 0,
        successful_predictions: 0,
        last_updated: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('❌ COLD-START: Failed to initialize vectors:', error);
      return false;
    }

    console.log('✅ COLD-START: Preference vectors initialized successfully', {
      featureWeights,
      swipeConfidence,
      distanceWeight: featureWeights.distance,
      vectorLengths: {
        cuisine: cuisineVector.length,
        vibe: vibeVector.length,
        price: priceVector.length,
        time: timeVector.length,
      }
    });

    return true;
  } catch (error) {
    console.error('❌ COLD-START: Error initializing preference vectors:', error);
    return false;
  }
};
