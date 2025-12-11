import { supabase } from '@/integrations/supabase/client';

interface FeatureWeights {
  cuisine: number;
  vibe: number;
  price: number;
  time: number;
  rating: number;
}

interface LearnedWeights {
  weights: FeatureWeights;
  aiAccuracy: number;
  totalRatings: number;
  hasLearningData: boolean;
}

const DEFAULT_WEIGHTS: FeatureWeights = {
  cuisine: 1.0,
  vibe: 1.0,
  price: 1.0,
  time: 1.0,
  rating: 1.0
};

/**
 * Fetches learned preference weights for a user from their preference vectors.
 * Returns default weights if no learning data exists.
 */
export const getUserLearnedWeights = async (userId: string): Promise<LearnedWeights> => {
  try {
    console.log('🧠 LEARNING: Fetching learned weights for user:', userId);

    const { data: vectors, error } = await supabase
      .from('user_preference_vectors')
      .select('feature_weights, ai_accuracy, total_ratings')
      .eq('user_id', userId)
      .single();

    if (error || !vectors) {
      console.log('📊 LEARNING: No preference vectors found, using default weights');
      return {
        weights: DEFAULT_WEIGHTS,
        aiAccuracy: 0,
        totalRatings: 0,
        hasLearningData: false
      };
    }

    // Parse feature weights from JSON, with fallback to defaults
    const storedWeights = vectors.feature_weights as Record<string, number> | null;
    
    const weights: FeatureWeights = {
      cuisine: getWeightValue(storedWeights, 'cuisine'),
      vibe: getWeightValue(storedWeights, 'vibe'),
      price: getWeightValue(storedWeights, 'price'),
      time: getWeightValue(storedWeights, 'time'),
      rating: getWeightValue(storedWeights, 'rating')
    };

    console.log('✅ LEARNING: Retrieved learned weights:', {
      weights,
      aiAccuracy: vectors.ai_accuracy,
      totalRatings: vectors.total_ratings
    });

    return {
      weights,
      aiAccuracy: vectors.ai_accuracy || 0,
      totalRatings: vectors.total_ratings || 0,
      hasLearningData: (vectors.total_ratings || 0) > 0
    };
  } catch (error) {
    console.error('❌ LEARNING: Error fetching learned weights:', error);
    return {
      weights: DEFAULT_WEIGHTS,
      aiAccuracy: 0,
      totalRatings: 0,
      hasLearningData: false
    };
  }
};

/**
 * Safely extracts a weight value from the stored weights object.
 * Clamps values between 0.5 and 2.0 to prevent extreme scoring.
 */
const getWeightValue = (
  storedWeights: Record<string, number> | null,
  key: string
): number => {
  if (!storedWeights || typeof storedWeights[key] !== 'number') {
    return 1.0; // Default neutral weight
  }
  
  // Clamp weights to reasonable range (0.5x to 2.0x multiplier)
  return Math.max(0.5, Math.min(2.0, storedWeights[key]));
};

/**
 * Calculates a confidence boost based on AI accuracy and total ratings.
 * Higher accuracy and more ratings = higher confidence in recommendations.
 */
export const getConfidenceBoost = (learnedWeights: LearnedWeights): number => {
  if (!learnedWeights.hasLearningData) {
    return 0;
  }

  // Boost based on AI accuracy (max +10% when accuracy > 70%)
  let boost = 0;
  if (learnedWeights.aiAccuracy > 70) {
    boost += (learnedWeights.aiAccuracy - 70) * 0.003; // Up to 9% boost
  }

  // Small boost for having rating history (max +3%)
  boost += Math.min(learnedWeights.totalRatings * 0.005, 0.03);

  console.log('🎯 LEARNING: Confidence boost calculated:', {
    aiAccuracy: learnedWeights.aiAccuracy,
    totalRatings: learnedWeights.totalRatings,
    boost: `+${Math.round(boost * 100)}%`
  });

  return boost;
};

/**
 * Applies learned weights to a base score component.
 * Returns the weighted score contribution.
 */
export const applyWeight = (
  baseValue: number,
  weight: number,
  label: string
): number => {
  const weighted = baseValue * weight;
  
  if (weight !== 1.0) {
    console.log(`⚖️ LEARNING: Applied ${label} weight:`, {
      base: `${Math.round(baseValue * 100)}%`,
      weight: weight.toFixed(2),
      result: `${Math.round(weighted * 100)}%`
    });
  }
  
  return weighted;
};
