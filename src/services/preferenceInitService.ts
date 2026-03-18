import { supabase } from '@/integrations/supabase/client';

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
}

// Maps preference diversity to weight emphasis.
// More selections in a category → user cares more about variety → slightly lower weight per item
// Fewer selections → user is very specific → higher weight (the AI should respect that strongly)
const calculateCategoryWeight = (selectedCount: number, totalOptions: number): number => {
  if (selectedCount === 0) return 1.0; // neutral
  
  const selectivity = 1 - (selectedCount / totalOptions);
  // Range: 0.8 (selected everything) to 1.4 (selected only 1 out of many)
  return 0.8 + selectivity * 0.6;
};

// Derive initial cuisine vector from selections
const buildCuisineVector = (cuisines: string[]): number[] => {
  const allCuisines = ['italian', 'japanese', 'mexican', 'french', 'indian', 'mediterranean', 'american', 'thai', 'chinese', 'korean'];
  return allCuisines.map(c => cuisines.includes(c) ? 1.0 : 0.2);
};

// Derive initial vibe vector from selections
const buildVibeVector = (vibes: string[]): number[] => {
  const allVibes = ['romantic', 'casual', 'outdoor', 'nightlife', 'cultural', 'adventurous'];
  return allVibes.map(v => vibes.includes(v) ? 1.0 : 0.2);
};

// Derive initial price vector from selections
const buildPriceVector = (priceRange: string[]): number[] => {
  const allPrices = ['budget', 'moderate', 'upscale', 'luxury'];
  return allPrices.map(p => priceRange.includes(p) ? 1.0 : 0.2);
};

// Derive initial time vector from selections
const buildTimeVector = (times: string[]): number[] => {
  const allTimes = ['brunch', 'lunch', 'afternoon', 'dinner', 'evening', 'flexible'];
  return allTimes.map(t => times.includes(t) ? 1.0 : 0.2);
};

export const initializePreferenceVectors = async (
  userId: string,
  preferences: PreferenceSelections
): Promise<boolean> => {
  try {
    console.log('🚀 COLD-START: Initializing preference vectors from onboarding selections');

    // Calculate feature weights based on selection patterns
    const featureWeights = {
      cuisine: calculateCategoryWeight(preferences.cuisines.length, 10),
      vibe: calculateCategoryWeight(preferences.vibes.length, 6),
      price: calculateCategoryWeight(preferences.priceRange.length, 4),
      time: calculateCategoryWeight(preferences.times.length, 6),
      rating: 1.0, // neutral default — no data to infer from yet
    };

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
      }
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
