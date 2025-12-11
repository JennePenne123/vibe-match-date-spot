import { supabase } from '@/integrations/supabase/client';
import { getUserLearnedWeights, getConfidenceBoost, applyWeight } from './learningIntegration';

export const calculateVenueAIScore = async (
  venueId: string,
  userId: string,
  partnerId?: string
): Promise<number> => {
  try {
    console.log('🧮 SCORING: Starting AI score calculation for venue:', venueId, 'user:', userId);

    // Fetch user preferences and learned weights in parallel
    const [prefsResult, learnedWeights] = await Promise.all([
      supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single(),
      getUserLearnedWeights(userId)
    ]);

    const { data: userPrefs, error: prefsError } = prefsResult;

    if (prefsError) {
      console.error('❌ SCORING: Error fetching user preferences:', prefsError);
      throw prefsError;
    }

    if (!userPrefs) {
      console.warn('⚠️ SCORING: No user preferences found, using default score');
      return 50;
    }

    // Get venue data
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single();

    if (venueError) {
      console.error('❌ SCORING: Error fetching venue data:', venueError);
      throw venueError;
    }

    if (!venue) {
      console.warn('⚠️ SCORING: Venue not found, using default score');
      return 50;
    }

    console.log('📋 SCORING: Venue details:', {
      name: venue.name,
      cuisine: venue.cuisine_type,
      price: venue.price_range,
      tags: venue.tags
    });

    console.log('👤 SCORING: User preferences:', {
      cuisines: userPrefs.preferred_cuisines,
      vibes: userPrefs.preferred_vibes,
      priceRange: userPrefs.preferred_price_range
    });

    if (learnedWeights.hasLearningData) {
      console.log('🧠 SCORING: Using learned weights:', learnedWeights.weights);
    }

    // Calculate base match score with learned weights applied
    let baseScore = 0.6; // Start with baseline (60%)
    const weights = learnedWeights.weights;

    console.log('🔍 SCORING: Starting with base score of 60%');

    // Cuisine matching with learned weight
    if (userPrefs.preferred_cuisines && venue.cuisine_type) {
      const userCuisines = userPrefs.preferred_cuisines.map((c: string) => c.toLowerCase());
      const venueCuisine = venue.cuisine_type.toLowerCase();
      
      let cuisineMatch = userCuisines.includes(venueCuisine);
      
      if (!cuisineMatch) {
        cuisineMatch = userCuisines.some((userCuisine: string) => 
          venueCuisine.includes(userCuisine) || userCuisine.includes(venueCuisine)
        );
      }
      
      const cuisineScore = cuisineMatch ? 0.25 : -0.05;
      const weightedCuisineScore = applyWeight(cuisineScore, weights.cuisine, 'cuisine');
      
      console.log('🍽️ SCORING: Cuisine matching:', { 
        userCuisines, 
        venueCuisine, 
        match: cuisineMatch,
        baseScore: `${cuisineScore > 0 ? '+' : ''}${Math.round(cuisineScore * 100)}%`,
        weightedScore: `${weightedCuisineScore > 0 ? '+' : ''}${Math.round(weightedCuisineScore * 100)}%`
      });
      
      baseScore += weightedCuisineScore;
    }

    // Price range matching with learned weight
    if (userPrefs.preferred_price_range && venue.price_range) {
      const priceMatch = userPrefs.preferred_price_range.includes(venue.price_range);
      
      if (priceMatch) {
        const priceScore = 0.15;
        const weightedPriceScore = applyWeight(priceScore, weights.price, 'price');
        
        console.log('💰 SCORING: Price matching:', { 
          userPrefs: userPrefs.preferred_price_range, 
          venue: venue.price_range, 
          match: true,
          baseScore: `+${Math.round(priceScore * 100)}%`,
          weightedScore: `+${Math.round(weightedPriceScore * 100)}%`
        });
        
        baseScore += weightedPriceScore;
      }
    }

    // Vibe matching with learned weight
    if (userPrefs.preferred_vibes && venue.tags && venue.tags.length > 0) {
      const vibeMatches = userPrefs.preferred_vibes.filter((vibe: string) => 
        venue.tags.some((tag: string) => 
          tag.toLowerCase().includes(vibe.toLowerCase()) ||
          vibe.toLowerCase().includes(tag.toLowerCase())
        )
      );
      
      // Infer vibes if no direct matches
      if (vibeMatches.length === 0) {
        if (userPrefs.preferred_vibes.includes('romantic')) {
          if (venue.price_range === '$$$' || venue.price_range === '$$$$' || 
              venue.cuisine_type?.toLowerCase().includes('fine') ||
              venue.cuisine_type?.toLowerCase().includes('italian') ||
              venue.cuisine_type?.toLowerCase().includes('french')) {
            vibeMatches.push('romantic (inferred)');
          }
        }
        
        if (userPrefs.preferred_vibes.includes('casual')) {
          if (venue.price_range === '$' || venue.price_range === '$$') {
            vibeMatches.push('casual (inferred)');
          }
        }
      }
      
      const vibeScore = vibeMatches.length * 0.1;
      const weightedVibeScore = applyWeight(vibeScore, weights.vibe, 'vibe');
      
      console.log('🎭 SCORING: Vibe matching:', { 
        userVibes: userPrefs.preferred_vibes, 
        venueTags: venue.tags, 
        matches: vibeMatches,
        baseScore: `+${Math.round(vibeScore * 100)}%`,
        weightedScore: `+${Math.round(weightedVibeScore * 100)}%`
      });
      
      baseScore += weightedVibeScore;
    }

    // Rating bonus with learned weight
    if (venue.rating) {
      const ratingBonus = Math.min((venue.rating - 3.0) * 0.05, 0.1);
      const weightedRatingBonus = applyWeight(ratingBonus, weights.rating, 'rating');
      
      console.log('⭐ SCORING: Rating bonus:', {
        rating: venue.rating,
        baseBonus: `+${Math.round(ratingBonus * 100)}%`,
        weightedBonus: `+${Math.round(weightedRatingBonus * 100)}%`
      });
      
      baseScore += weightedRatingBonus;
    }

    // Calculate contextual factors with time weight
    const contextualScore = await calculateContextualFactors(venueId);
    const weightedContextual = applyWeight(contextualScore, weights.time, 'time/context');

    // Apply confidence boost from learning data
    const confidenceBoost = getConfidenceBoost(learnedWeights);
    
    // Final AI score (0-100 scale)
    const rawScore = (baseScore + weightedContextual + confidenceBoost) * 100;
    const finalScore = Math.max(35, Math.min(98, rawScore));
    
    console.log('🎯 SCORING: Final scoring details:', {
      venue: venue.name,
      baseScore: `${Math.round(baseScore * 100)}%`,
      contextualScore: `${Math.round(weightedContextual * 100)}%`,
      confidenceBoost: `+${Math.round(confidenceBoost * 100)}%`,
      finalScore: `${Math.round(finalScore)}%`,
      learningApplied: learnedWeights.hasLearningData,
      aiAccuracy: learnedWeights.aiAccuracy
    });

    // Store the AI score with learning metadata
    const matchFactors = {
      cuisine_match: userPrefs.preferred_cuisines?.includes(venue.cuisine_type) || false,
      price_match: userPrefs.preferred_price_range?.includes(venue.price_range) || false,
      vibe_matches: userPrefs.preferred_vibes?.filter((vibe: string) => 
        venue.tags?.some((tag: string) => tag.toLowerCase().includes(vibe.toLowerCase()))
      ) || [],
      rating_bonus: venue.rating ? Math.min((venue.rating - 3.5) * 0.1, 0.15) : 0,
      learned_weights_applied: learnedWeights.hasLearningData,
      weight_multipliers: learnedWeights.hasLearningData ? learnedWeights.weights : null
    };

    const { error: insertError } = await supabase
      .from('ai_venue_scores')
      .upsert({
        venue_id: venueId,
        user_id: userId,
        ai_score: Math.round(finalScore * 100) / 100,
        match_factors: matchFactors,
        contextual_score: Math.round(weightedContextual * 100) / 100,
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error storing venue AI score:', insertError);
    }

    return finalScore;
  } catch (error) {
    console.error('Error calculating venue AI score:', error);
    return 50;
  }
};

export const calculateContextualFactors = async (venueId: string): Promise<number> => {
  let contextualBonus = 0;

  // Time-based factors (business hours, peak times)
  const currentHour = new Date().getHours();
  if (currentHour >= 18 && currentHour <= 21) {
    contextualBonus += 0.1; // Prime dinner time
  } else if (currentHour >= 11 && currentHour <= 14) {
    contextualBonus += 0.05; // Lunch time
  }

  // Weather factor (simplified - in real implementation would use weather API)
  // For now, indoor venues get slight preference in winter months
  const currentMonth = new Date().getMonth();
  if (currentMonth >= 10 || currentMonth <= 2) {
    contextualBonus += 0.05; // Winter months favor indoor venues
  }

  return contextualBonus;
};

export const calculateConfidenceLevel = (aiScore: number, matchFactors: any): number => {
  let confidence = aiScore / 100;
  
  // Boost confidence if we have multiple matching factors
  const matchCount = Object.values(matchFactors || {}).filter(Boolean).length;
  confidence += matchCount * 0.1;
  
  return Math.min(0.95, confidence);
};
