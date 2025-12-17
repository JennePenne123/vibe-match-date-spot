import { supabase } from '@/integrations/supabase/client';
import { getUserLearnedWeights, getConfidenceBoost, applyWeight } from './learningIntegration';

// Calculate individual user score based on preferences
const calculateUserScore = (
  userPrefs: any,
  venue: any,
  weights: { cuisine: number; price: number; vibe: number; rating: number; time: number }
): { score: number; matches: { cuisine: boolean; price: boolean; vibes: string[] } } => {
  let score = 0.6; // Start with baseline (60%)
  const matches = { cuisine: false, price: false, vibes: [] as string[] };

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
    
    matches.cuisine = cuisineMatch;
    const cuisineScore = cuisineMatch ? 0.25 : -0.05;
    score += applyWeight(cuisineScore, weights.cuisine, 'cuisine');
  }

  // Price range matching with learned weight
  if (userPrefs.preferred_price_range && venue.price_range) {
    const priceMatch = userPrefs.preferred_price_range.includes(venue.price_range);
    
    if (priceMatch) {
      matches.price = true;
      const priceScore = 0.15;
      score += applyWeight(priceScore, weights.price, 'price');
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
    
    matches.vibes = vibeMatches;
    const vibeScore = vibeMatches.length * 0.1;
    score += applyWeight(vibeScore, weights.vibe, 'vibe');
  }

  // Rating bonus with learned weight
  if (venue.rating) {
    const ratingBonus = Math.min((venue.rating - 3.0) * 0.05, 0.1);
    score += applyWeight(ratingBonus, weights.rating, 'rating');
  }

  return { score, matches };
};

// Calculate shared preference bonus for collaborative scoring
const calculateSharedBonus = (
  userMatches: { cuisine: boolean; price: boolean; vibes: string[] },
  partnerMatches: { cuisine: boolean; price: boolean; vibes: string[] }
): { bonus: number; sharedMatches: { cuisine: boolean; price: boolean; vibes: string[] } } => {
  let bonus = 0;
  const sharedMatches = { cuisine: false, price: false, vibes: [] as string[] };

  // Both users match cuisine: +15% bonus
  if (userMatches.cuisine && partnerMatches.cuisine) {
    bonus += 0.15;
    sharedMatches.cuisine = true;
  }

  // Both users match price: +10% bonus
  if (userMatches.price && partnerMatches.price) {
    bonus += 0.10;
    sharedMatches.price = true;
  }

  // Both users share vibe matches: +10% per shared vibe
  const userVibeSet = new Set(userMatches.vibes.map(v => v.toLowerCase().replace(' (inferred)', '')));
  const partnerVibeSet = new Set(partnerMatches.vibes.map(v => v.toLowerCase().replace(' (inferred)', '')));
  
  for (const vibe of userVibeSet) {
    if (partnerVibeSet.has(vibe)) {
      bonus += 0.10;
      sharedMatches.vibes.push(vibe);
    }
  }

  return { bonus, sharedMatches };
};

export const calculateVenueAIScore = async (
  venueId: string,
  userId: string,
  partnerId?: string
): Promise<number> => {
  try {
    const isCollaborative = partnerId && partnerId.trim() !== '';
    console.log('🧮 SCORING: Starting AI score calculation for venue:', venueId, 'user:', userId, isCollaborative ? `partner: ${partnerId}` : '(solo)');

    // Fetch user preferences and learned weights
    const [prefsResult, learnedWeights] = await Promise.all([
      supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single(),
      getUserLearnedWeights(userId)
    ]);

    // Fetch partner preferences separately if collaborative
    let partnerPrefsResult = null;
    if (isCollaborative) {
      partnerPrefsResult = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', partnerId)
        .single();
    }

    const { data: userPrefs, error: prefsError } = prefsResult;

    if (prefsError) {
      console.error('❌ SCORING: Error fetching user preferences:', prefsError);
      throw prefsError;
    }

    if (!userPrefs) {
      console.warn('⚠️ SCORING: No user preferences found, using default score');
      return 50;
    }

    // Handle partner preferences (graceful fallback to solo scoring)
    let partnerPrefs = null;
    if (isCollaborative && partnerPrefsResult) {
      if (partnerPrefsResult.error) {
        console.warn('⚠️ SCORING: Error fetching partner preferences, falling back to solo scoring:', partnerPrefsResult.error);
      } else {
        partnerPrefs = partnerPrefsResult.data;
      }
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

    if (partnerPrefs) {
      console.log('👥 SCORING: Partner preferences:', {
        cuisines: partnerPrefs.preferred_cuisines,
        vibes: partnerPrefs.preferred_vibes,
        priceRange: partnerPrefs.preferred_price_range
      });
    }

    if (learnedWeights.hasLearningData) {
      console.log('🧠 SCORING: Using learned weights:', learnedWeights.weights);
    }

    const weights = learnedWeights.weights;

    // Calculate user score
    const userResult = calculateUserScore(userPrefs, venue, weights);
    let baseScore = userResult.score;
    let sharedMatches = null;

    // Calculate collaborative score if partner preferences available
    if (partnerPrefs) {
      const partnerResult = calculateUserScore(partnerPrefs, venue, weights);
      const sharedResult = calculateSharedBonus(userResult.matches, partnerResult.matches);
      
      // Average scores and add shared bonus
      baseScore = (userResult.score + partnerResult.score) / 2 + sharedResult.bonus;
      sharedMatches = sharedResult.sharedMatches;
      
      console.log('🤝 SCORING: Collaborative scoring:', {
        userScore: `${Math.round(userResult.score * 100)}%`,
        partnerScore: `${Math.round(partnerResult.score * 100)}%`,
        sharedBonus: `+${Math.round(sharedResult.bonus * 100)}%`,
        combinedScore: `${Math.round(baseScore * 100)}%`,
        sharedMatches: sharedResult.sharedMatches
      });
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
      aiAccuracy: learnedWeights.aiAccuracy,
      isCollaborative: !!partnerPrefs
    });

    // Store the AI score with learning metadata
    const matchFactors = {
      cuisine_match: userResult.matches.cuisine,
      price_match: userResult.matches.price,
      vibe_matches: userResult.matches.vibes,
      rating_bonus: venue.rating ? Math.min((venue.rating - 3.5) * 0.1, 0.15) : 0,
      learned_weights_applied: learnedWeights.hasLearningData,
      weight_multipliers: learnedWeights.hasLearningData ? learnedWeights.weights : null,
      is_collaborative: !!partnerPrefs,
      partner_id: partnerPrefs ? partnerId : null,
      shared_matches: sharedMatches
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
