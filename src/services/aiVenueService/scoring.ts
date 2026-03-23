import { supabase } from '@/integrations/supabase/client';
import { getUserLearnedWeights, getConfidenceBoost, applyWeight } from './learningIntegration';
import { getMoodScoreModifier, getMoodInfluenceLabel } from './moodScoring';
import { getImplicitSignalBoost } from '@/services/implicitSignalsService';

// Calculate individual user score based on preferences
const calculateUserScore = (
  userPrefs: any,
  venue: any,
  weights: { cuisine: number; price: number; vibe: number; rating: number; time: number }
): { score: number; matches: { cuisine: boolean; price: boolean; vibes: string[]; activities: string[]; venueType: boolean; dietary: boolean; time: boolean } } => {
  let score = 0.10; // Very low baseline — venues must EARN their score through preference matches
  const matches = { cuisine: false, price: false, vibes: [] as string[], activities: [] as string[], venueType: false, dietary: false, time: false };

  // Cuisine matching with learned weight (25%)
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

  // Price range matching with learned weight (15%)
  if (userPrefs.preferred_price_range && venue.price_range) {
    const priceMatch = userPrefs.preferred_price_range.includes(venue.price_range);
    
    if (priceMatch) {
      matches.price = true;
      score += applyWeight(0.15, weights.price, 'price');
    }
  }

  // Vibe matching with learned weight (15%)
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
    const vibeScore = vibeMatches.length * 0.08;
    score += applyWeight(vibeScore, weights.vibe, 'vibe');
  }

  // Activity matching (10%) - NEW
  if (userPrefs.preferred_activities && venue.tags && venue.tags.length > 0) {
    const activityTagMap: Record<string, string[]> = {
      'dining': ['restaurant', 'dining', 'food', 'essen'],
      'dining_plus': ['experience', 'event', 'erlebnis'],
      'cocktails': ['bar', 'cocktail', 'drinks', 'lounge'],
      'cultural_act': ['museum', 'gallery', 'art', 'kultur', 'theater'],
      'active': ['sport', 'bowling', 'climbing', 'fitness', 'aktiv'],
      'nightlife_act': ['club', 'party', 'nightlife', 'disco'],
    };
    
    const venueTags = venue.tags.map((t: string) => t.toLowerCase());
    const venueCuisine = (venue.cuisine_type || '').toLowerCase();
    const venueDesc = (venue.description || '').toLowerCase();
    const searchText = [...venueTags, venueCuisine, venueDesc].join(' ');
    
    const activityMatches = (userPrefs.preferred_activities as string[]).filter((act: string) => {
      const keywords = activityTagMap[act] || [act.toLowerCase()];
      return keywords.some(kw => searchText.includes(kw));
    });
    
    if (activityMatches.length > 0) {
      matches.activities = activityMatches;
      score += 0.10;
    }
  }

  // Venue Type matching (10%) - NEW
  if (userPrefs.preferred_venue_types && userPrefs.preferred_venue_types.length > 0) {
    const venueTypeTagMap: Record<string, string[]> = {
      'museum': ['museum', 'ausstellung', 'exhibition'],
      'gallery': ['gallery', 'galerie', 'art', 'kunst'],
      'theater_venue': ['theater', 'theatre', 'bühne', 'schauspiel'],
      'cinema': ['cinema', 'kino', 'film', 'movie'],
      'concert_hall': ['concert', 'konzert', 'music venue', 'live music'],
      'exhibition': ['exhibition', 'ausstellung', 'messe'],
      'mini_golf': ['mini golf', 'minigolf', 'adventure golf'],
      'bowling': ['bowling', 'bowlingbahn'],
      'escape_room': ['escape room', 'escape game'],
      'climbing': ['climbing', 'klettern', 'bouldering', 'boulderhalle'],
      'swimming': ['swimming', 'pool', 'schwimmbad', 'therme'],
      'hiking': ['hiking', 'wandern', 'trail'],
      
      'karaoke': ['karaoke'],
      'comedy_club': ['comedy', 'comedy club', 'stand-up'],
      'arcade': ['arcade', 'spielhalle', 'gaming'],
      'live_event': ['event', 'live', 'veranstaltung'],
      'spa_wellness': ['spa', 'wellness', 'sauna', 'massage'],
    };
    
    const venueTags = (venue.tags || []).map((t: string) => t.toLowerCase());
    const venueCuisine = (venue.cuisine_type || '').toLowerCase();
    const venueName = (venue.name || '').toLowerCase();
    const venueDesc = (venue.description || '').toLowerCase();
    const searchText = [...venueTags, venueCuisine, venueName, venueDesc].join(' ');
    
    const typeMatch = (userPrefs.preferred_venue_types as string[]).some((vt: string) => {
      const keywords = venueTypeTagMap[vt] || [vt.toLowerCase().replace('_', ' ')];
      return keywords.some(kw => searchText.includes(kw));
    });
    
    if (typeMatch) {
      matches.venueType = true;
      score += 0.10;
    }
  }

  // Time preference matching (5%) - NEW
  if (userPrefs.preferred_times && userPrefs.preferred_times.length > 0) {
    const currentHour = new Date().getHours();
    const timeSlotMap: Record<string, [number, number]> = {
      'brunch': [8, 11], 'lunch': [11, 14], 'afternoon': [14, 17],
      'dinner': [17, 20], 'evening': [20, 23], 'flexible': [0, 24],
    };
    
    const isCurrentTimePreferred = (userPrefs.preferred_times as string[]).some((t: string) => {
      const range = timeSlotMap[t];
      if (!range) return false;
      return currentHour >= range[0] && currentHour < range[1];
    });
    
    if (isCurrentTimePreferred || (userPrefs.preferred_times as string[]).includes('flexible')) {
      matches.time = true;
      score += 0.05;
    }
  }

  // Dietary compatibility (5%) - NEW  
  if (userPrefs.dietary_restrictions && userPrefs.dietary_restrictions.length > 0 && venue.tags) {
    const venueTags = venue.tags.map((t: string) => t.toLowerCase());
    const venueDesc = (venue.description || '').toLowerCase();
    const searchText = [...venueTags, venueDesc].join(' ');
    
    const dietaryMatch = (userPrefs.dietary_restrictions as string[]).some((diet: string) => 
      searchText.includes(diet.toLowerCase().replace('_', ' '))
    );
    
    if (dietaryMatch) {
      matches.dietary = true;
      score += 0.05;
    }
  }

  // Rating bonus with learned weight (5%)
  if (venue.rating) {
    const ratingBonus = Math.min((venue.rating - 3.0) * 0.05, 0.1);
    score += applyWeight(ratingBonus, weights.rating, 'rating');
  }

  return { score, matches };
};

// Calculate shared preference bonus for collaborative scoring
const calculateSharedBonus = (
  userMatches: { cuisine: boolean; price: boolean; vibes: string[]; activities: string[]; venueType: boolean },
  partnerMatches: { cuisine: boolean; price: boolean; vibes: string[]; activities: string[]; venueType: boolean }
): { bonus: number; sharedMatches: { cuisine: boolean; price: boolean; vibes: string[]; activities: boolean; venueType: boolean } } => {
  let bonus = 0;
  const sharedMatches = { cuisine: false, price: false, vibes: [] as string[], activities: false, venueType: false };

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

  // Both users match activities: +10% bonus
  if (userMatches.activities.length > 0 && partnerMatches.activities.length > 0) {
    const sharedActs = userMatches.activities.filter(a => partnerMatches.activities.includes(a));
    if (sharedActs.length > 0) {
      bonus += 0.10;
      sharedMatches.activities = true;
    }
  }

  // Both users match venue type: +5% bonus
  if (userMatches.venueType && partnerMatches.venueType) {
    bonus += 0.05;
    sharedMatches.venueType = true;
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

    // Apply mood-based modifier
    const moodModifier = getMoodScoreModifier(venue);
    const moodLabel = getMoodInfluenceLabel();

    // Apply confidence boost from learning data
    const confidenceBoost = getConfidenceBoost(learnedWeights);

    // Apply implicit signal boost
    const implicitBoost = await getImplicitSignalBoost(userId, venueId);
    
    // Final AI score (0-100 scale)
    const rawScore = (baseScore + weightedContextual + moodModifier + confidenceBoost + implicitBoost) * 100;
    const finalScore = Math.max(35, Math.min(98, rawScore));
    
    console.log('🎯 SCORING: Final scoring details:', {
      venue: venue.name,
      baseScore: `${Math.round(baseScore * 100)}%`,
      contextualScore: `${Math.round(weightedContextual * 100)}%`,
      moodModifier: moodModifier !== 0 ? `${moodModifier > 0 ? '+' : ''}${Math.round(moodModifier * 100)}% (${moodLabel})` : 'none',
      confidenceBoost: `+${Math.round(confidenceBoost * 100)}%`,
      implicitBoost: implicitBoost !== 0 ? `${implicitBoost > 0 ? '+' : ''}${Math.round(implicitBoost * 100)}%` : 'none',
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
      activity_matches: userResult.matches.activities,
      venue_type_match: userResult.matches.venueType,
      dietary_match: userResult.matches.dietary,
      time_match: userResult.matches.time,
      rating_bonus: venue.rating ? Math.min((venue.rating - 3.5) * 0.1, 0.15) : 0,
      learned_weights_applied: learnedWeights.hasLearningData,
      weight_multipliers: learnedWeights.hasLearningData ? learnedWeights.weights : null,
      is_collaborative: !!partnerPrefs,
      partner_id: partnerPrefs ? partnerId : null,
      shared_matches: sharedMatches,
      mood_modifier: moodModifier !== 0 ? moodModifier : null,
      mood_label: moodLabel
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
