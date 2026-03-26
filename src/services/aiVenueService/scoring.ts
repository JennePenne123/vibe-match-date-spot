import { supabase } from '@/integrations/supabase/client';
import { getUserLearnedWeights, getConfidenceBoost, applyWeight } from './learningIntegration';
import { getMoodScoreModifier, getMoodInfluenceLabel } from './moodScoring';
import { getImplicitSignalBoost } from '@/services/implicitSignalsService';
import { getCombinedContextScore } from './contextCombinationScoring';
import { getTodayMood } from '@/pages/MoodCheckIn';
import { getPhotoVibeScoreModifier, getPhotoVibeLabel } from './photoVibeScoring';
import { getPairFriendlyScoreModifier, getPairFriendlyLabel } from './pairFriendlyScoring';
import { getSeasonalScoreModifier, getSeasonalLabel } from './seasonalScoring';

/**
 * Cuisine similarity matrix — returns 0..1 similarity between two cuisines.
 * 1.0 = exact match, 0.85 = same family (e.g. Italian↔Mediterranean),
 * 0.6 = loosely related (e.g. Greek↔Turkish), 0 = unrelated.
 */
const CUISINE_FAMILIES: Record<string, { members: string[]; similarity: number }[]> = {
  'italian':       [{ members: ['mediterranean', 'greek', 'spanish'], similarity: 0.75 }, { members: ['french'], similarity: 0.6 }],
  'greek':         [{ members: ['mediterranean', 'turkish', 'lebanese'], similarity: 0.8 }, { members: ['italian', 'spanish'], similarity: 0.65 }],
  'mediterranean': [{ members: ['italian', 'greek', 'spanish', 'turkish', 'lebanese'], similarity: 0.8 }, { members: ['french', 'moroccan'], similarity: 0.6 }],
  'spanish':       [{ members: ['mediterranean', 'italian', 'portuguese'], similarity: 0.75 }, { members: ['mexican', 'latin'], similarity: 0.5 }],
  'turkish':       [{ members: ['mediterranean', 'greek', 'lebanese', 'arabic', 'middle_eastern'], similarity: 0.8 }, { members: ['indian'], similarity: 0.4 }],
  'japanese':      [{ members: ['korean', 'asian'], similarity: 0.7 }, { members: ['chinese', 'vietnamese', 'thai'], similarity: 0.55 }],
  'chinese':       [{ members: ['asian', 'vietnamese'], similarity: 0.7 }, { members: ['thai', 'korean', 'japanese'], similarity: 0.55 }],
  'korean':        [{ members: ['japanese', 'asian'], similarity: 0.7 }, { members: ['chinese'], similarity: 0.55 }],
  'vietnamese':    [{ members: ['asian', 'thai', 'chinese'], similarity: 0.7 }, { members: ['japanese', 'korean'], similarity: 0.5 }],
  'thai':          [{ members: ['asian', 'vietnamese'], similarity: 0.7 }, { members: ['indian', 'chinese'], similarity: 0.5 }],
  'indian':        [{ members: ['curry'], similarity: 0.9 }, { members: ['thai', 'middle_eastern'], similarity: 0.4 }],
  'mexican':       [{ members: ['latin', 'tex-mex'], similarity: 0.85 }, { members: ['spanish'], similarity: 0.5 }],
  'french':        [{ members: ['european'], similarity: 0.7 }, { members: ['italian', 'mediterranean'], similarity: 0.6 }],
  'german':        [{ members: ['european', 'regional'], similarity: 0.7 }, { members: ['french'], similarity: 0.45 }],
  'american':      [{ members: ['burger', 'bbq', 'steakhouse', 'grill'], similarity: 0.85 }, { members: ['mexican'], similarity: 0.4 }],
};

function getCuisineSimilarity(userCuisine: string, venueCuisine: string): number {
  const u = userCuisine.toLowerCase().trim();
  const v = venueCuisine.toLowerCase().trim();
  
  // Exact match
  if (u === v) return 1.0;
  
  // Partial/contains match (e.g. "Italian Restaurant" matches "Italian")
  if (v.includes(u) || u.includes(v)) return 0.95;
  
  // Check family relationships
  const families = CUISINE_FAMILIES[u];
  if (families) {
    for (const family of families) {
      if (family.members.some(m => v.includes(m) || m.includes(v))) {
        return family.similarity;
      }
    }
  }
  
  // Reverse lookup (venue → user)
  const reverseFamilies = CUISINE_FAMILIES[v];
  if (reverseFamilies) {
    for (const family of reverseFamilies) {
      if (family.members.some(m => u.includes(m) || m.includes(u))) {
        return family.similarity;
      }
    }
  }
  
  return 0;
}

function getBestCuisineSimilarity(userCuisines: string[], venueCuisine: string): { similarity: number; matchedCuisine: string } {
  let best = { similarity: 0, matchedCuisine: '' };
  for (const uc of userCuisines) {
    const sim = getCuisineSimilarity(uc, venueCuisine);
    if (sim > best.similarity) {
      best = { similarity: sim, matchedCuisine: uc };
    }
  }
  return best;
}

// Calculate individual user score based on preferences
const calculateUserScore = (
  userPrefs: any,
  venue: any,
  weights: { cuisine: number; price: number; vibe: number; rating: number; time: number }
): { score: number; maxPossible: number; matches: { cuisine: boolean; price: boolean; vibes: string[]; activities: string[]; venueType: boolean; dietary: boolean; time: boolean } } => {
  let score = 0;
  let maxPossible = 0;
  const matches = { cuisine: false, price: false, vibes: [] as string[], activities: [] as string[], venueType: false, dietary: false, time: false };

  // Cuisine matching with similarity matrix + learned weight
  if (userPrefs.preferred_cuisines && venue.cuisine_type) {
    maxPossible += 0.35;
    const userCuisines = userPrefs.preferred_cuisines.map((c: string) => c.toLowerCase());
    const venueCuisine = venue.cuisine_type.toLowerCase();
    
    const { similarity, matchedCuisine } = getBestCuisineSimilarity(userCuisines, venueCuisine);
    
    if (similarity >= 0.6) {
      // Proportional score: exact match = full 0.35, similar = scaled down
      matches.cuisine = true;
      const cuisineScore = 0.35 * similarity;
      score += applyWeight(cuisineScore, weights.cuisine, 'cuisine');
    } else if (similarity > 0) {
      // Weak match — small bonus instead of penalty
      matches.cuisine = false;
      score += applyWeight(0.35 * similarity * 0.5, weights.cuisine, 'cuisine');
    } else {
      // No relation at all — penalty
      matches.cuisine = false;
      score += applyWeight(-0.15, weights.cuisine, 'cuisine');
    }
  }

  // Price range matching
  if (userPrefs.preferred_price_range && venue.price_range) {
    maxPossible += 0.22;
    const priceMatch = userPrefs.preferred_price_range.includes(venue.price_range);
    
    if (priceMatch) {
      matches.price = true;
      score += applyWeight(0.22, weights.price, 'price');
    } else {
      matches.price = false;
      score += applyWeight(-0.06, weights.price, 'price');
    }
  }

  // Vibe matching
  if (userPrefs.preferred_vibes && userPrefs.preferred_vibes.length > 0) {
    maxPossible += 0.12;
    
    // Build a comprehensive search corpus from all venue data
    const venueTags = (venue.tags || []).map((t: string) => t.toLowerCase());
    const venueCuisine = (venue.cuisine_type || '').toLowerCase();
    const venueName = (venue.name || '').toLowerCase();
    const venueDesc = (venue.description || '').toLowerCase();
    const venuePrice = (venue.price_range || '');
    const searchCorpus = [...venueTags, venueCuisine, venueName, venueDesc].join(' ');
    
    // Deep vibe keyword map — each vibe maps to multiple signal groups
    const VIBE_SIGNALS: Record<string, { keywords: string[]; priceHint?: string[]; cuisineHint?: string[] }> = {
      'romantic': {
        keywords: ['romantic', 'candlelight', 'intimate', 'cozy', 'gemütlich', 'date night', 'fine dining', 'wine bar', 'cocktail', 'lounge', 'rooftop', 'garden', 'terrace'],
        priceHint: ['$$$', '$$$$'],
        cuisineHint: ['italian', 'french', 'mediterranean', 'japanese', 'spanish'],
      },
      'casual': {
        keywords: ['casual', 'relaxed', 'laid-back', 'locker', 'entspannt', 'bistro', 'café', 'cafe', 'burger', 'pizza', 'street food', 'pub', 'biergarten', 'beer garden'],
        priceHint: ['$', '$$'],
      },
      'trendy': {
        keywords: ['trendy', 'hip', 'modern', 'stylish', 'instagram', 'hotspot', 'new', 'concept', 'fusion', 'craft', 'artisan', 'design', 'szene', 'popup', 'pop-up'],
      },
      'cozy': {
        keywords: ['cozy', 'cosy', 'gemütlich', 'warm', 'intimate', 'small', 'fireplace', 'kamin', 'hygge', 'wohnzimmer', 'snug', 'charming'],
        priceHint: ['$$', '$$$'],
      },
      'lively': {
        keywords: ['lively', 'lebhaft', 'buzzing', 'energetic', 'party', 'music', 'live', 'dj', 'dance', 'club', 'nightlife', 'bar', 'happy hour', 'karaoke'],
      },
      'elegant': {
        keywords: ['elegant', 'upscale', 'luxury', 'luxus', 'premium', 'fine dining', 'gourmet', 'michelin', 'tasting menu', 'sommelier', 'sophisticated'],
        priceHint: ['$$$', '$$$$'],
        cuisineHint: ['french', 'japanese', 'italian'],
      },
      'adventurous': {
        keywords: ['adventure', 'abenteuer', 'exotic', 'exotisch', 'unique', 'unusual', 'experience', 'erlebnis', 'themed', 'immersive', 'surprise', 'hidden', 'secret'],
      },
      'cultural': {
        keywords: ['cultural', 'kultur', 'art', 'kunst', 'gallery', 'museum', 'theater', 'theatre', 'literary', 'historic', 'traditional', 'authentic', 'traditionell'],
      },
      'outdoor': {
        keywords: ['outdoor', 'draußen', 'terrace', 'terrasse', 'rooftop', 'garden', 'garten', 'biergarten', 'beer garden', 'patio', 'park', 'nature', 'waterfront', 'riverside'],
      },
      'family': {
        keywords: ['family', 'familie', 'kid-friendly', 'kinderfreundlich', 'playground', 'spielplatz', 'brunch', 'buffet', 'all-you-can-eat'],
        priceHint: ['$', '$$'],
      },
    };
    
    const vibeMatches: string[] = [];
    
    for (const vibe of userPrefs.preferred_vibes as string[]) {
      const vibeLower = vibe.toLowerCase();
      const signals = VIBE_SIGNALS[vibeLower];
      
      if (!signals) {
        // Fallback: direct tag matching for unknown vibes
        if (searchCorpus.includes(vibeLower)) {
          vibeMatches.push(vibe);
        }
        continue;
      }
      
      let vibeScore = 0;
      
      // 1. Keyword matching against full search corpus (strongest signal)
      const keywordHits = signals.keywords.filter(kw => searchCorpus.includes(kw));
      if (keywordHits.length > 0) {
        vibeScore += Math.min(keywordHits.length * 0.3, 1.0); // Cap at 1.0
      }
      
      // 2. Price hint inference (weaker signal)
      if (signals.priceHint && venuePrice && signals.priceHint.includes(venuePrice)) {
        vibeScore += 0.25;
      }
      
      // 3. Cuisine hint inference (weaker signal)
      if (signals.cuisineHint && venueCuisine) {
        const cuisineMatch = signals.cuisineHint.some(c => venueCuisine.includes(c));
        if (cuisineMatch) {
          vibeScore += 0.2;
        }
      }
      
      // Threshold: vibeScore >= 0.25 counts as a match
      if (vibeScore >= 0.25) {
        vibeMatches.push(vibeScore >= 0.5 ? vibe : `${vibe} (inferred)`);
      }
    }
    
    matches.vibes = vibeMatches;
    const vibeScore = vibeMatches.length > 0 ? Math.min(vibeMatches.length * 0.12, 0.24) : -0.04;
    score += applyWeight(vibeScore, weights.vibe, 'vibe');
  }

  // Activity matching (10%)
  if (userPrefs.preferred_activities && venue.tags && venue.tags.length > 0) {
    maxPossible += 0.10;
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

  // Venue Type matching (10%)
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
      maxPossible += 0.10;
      matches.venueType = true;
      score += 0.10;
    }
  }

  // Time preference matching (5%)
  if (userPrefs.preferred_times && userPrefs.preferred_times.length > 0) {
    maxPossible += 0.05;
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

  // Dietary compatibility (5%)
  if (userPrefs.dietary_restrictions && userPrefs.dietary_restrictions.length > 0 && venue.tags) {
    maxPossible += 0.05;
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

  // Rating bonus (5%) — weighted by review count confidence (Bayesian approach)
  if (venue.rating) {
    maxPossible += 0.10;
    const rawRatingBonus = Math.min((venue.rating - 3.0) * 0.05, 0.1);
    
    // Review count confidence: more reviews = more trustworthy rating
    // Uses Bayesian-style regression: effective_rating blends toward mean (3.5) with few reviews
    const reviewCount = venue.review_count || venue.reviewCount || venue.user_ratings_total || 0;
    const REVIEW_CONFIDENCE_THRESHOLD = 20; // Reviews needed for full confidence
    const confidence = reviewCount > 0 
      ? Math.min(reviewCount / REVIEW_CONFIDENCE_THRESHOLD, 1.0) 
      : 0.5; // No data = 50% confidence (neutral)
    
    const ratingBonus = rawRatingBonus * confidence;
    score += applyWeight(ratingBonus, weights.rating, 'rating');
    
    // Extra bonus for highly-reviewed venues (social proof)
    if (reviewCount >= 50 && venue.rating >= 4.0) {
      score += 0.03; // Small but meaningful "proven quality" bonus
    }
  }

  return { score, maxPossible, matches };
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
    let baseMaxPossible = userResult.maxPossible;
    let sharedMatches = null;

    // Calculate collaborative score if partner preferences available
    if (partnerPrefs) {
      const partnerResult = calculateUserScore(partnerPrefs, venue, weights);
      const sharedResult = calculateSharedBonus(userResult.matches, partnerResult.matches);
      
      baseScore = (userResult.score + partnerResult.score) / 2 + sharedResult.bonus;
      baseMaxPossible = (userResult.maxPossible + partnerResult.maxPossible) / 2 + sharedResult.bonus;
      sharedMatches = sharedResult.sharedMatches;
      
      console.log('🤝 SCORING: Collaborative scoring:', {
        userScore: `${Math.round(userResult.score * 100)}%`,
        partnerScore: `${Math.round(partnerResult.score * 100)}%`,
        sharedBonus: `+${Math.round(sharedResult.bonus * 100)}%`,
        combinedScore: `${Math.round(baseScore * 100)}%`,
        sharedMatches: sharedResult.sharedMatches
      });
    }

    // Normalize base score by what was actually evaluable
    const effectiveMax = Math.max(baseMaxPossible, 0.20);
    const normalizedBase = baseScore / effectiveMax;

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

    // Apply combined context scoring (synergy + auto time)
    const currentMood = getTodayMood();
    const occasionFromPrefs = (userPrefs.lifestyle_data as any)?.occasion || null;
    const priorityFromPrefs = (userPrefs.lifestyle_data as any)?.priority_weights || null;
    const combinedCtx = getCombinedContextScore(venue, occasionFromPrefs, currentMood, priorityFromPrefs);
    const combinedCtxBonus = (combinedCtx.synergyBonus + combinedCtx.autoContextBonus) / 100;

    // Apply photo-based vibe scoring (Signal #15)
    const venuePhotos = Array.isArray(venue.photos) ? venue.photos : [];
    const photoVibeResult = getPhotoVibeScoreModifier(venuePhotos, userPrefs.preferred_vibes);
    const photoVibeModifier = photoVibeResult.modifier;
    const photoVibeLabel = getPhotoVibeLabel(photoVibeResult.matchedVibes);

    // Apply pair-friendly scoring (Signal #16)
    const pairResult = getPairFriendlyScoreModifier(venue, !!partnerPrefs);
    const pairModifier = pairResult.modifier;
    const pairLabel = getPairFriendlyLabel(pairResult.reasons);

    // Apply seasonal specials scoring (Signal #17)
    const seasonalResult = getSeasonalScoreModifier(venue.seasonal_specials, userPrefs.preferred_vibes);
    const seasonalModifier = seasonalResult.modifier;
    const seasonalLabel = getSeasonalLabel(seasonalResult.activeSpecials);
    
    // Final AI score (0-100 scale) — normalized so sparse data doesn't penalize
    const rawScore = (normalizedBase + weightedContextual + moodModifier + confidenceBoost + implicitBoost + combinedCtxBonus + photoVibeModifier + pairModifier + seasonalModifier) * 100;
    const finalScore = Math.max(10, Math.min(98, rawScore));
    
    console.log('🎯 SCORING: Final scoring details:', {
      venue: venue.name,
      baseScore: `${Math.round(baseScore * 100)}%`,
      contextualScore: `${Math.round(weightedContextual * 100)}%`,
      moodModifier: moodModifier !== 0 ? `${moodModifier > 0 ? '+' : ''}${Math.round(moodModifier * 100)}% (${moodLabel})` : 'none',
      confidenceBoost: `+${Math.round(confidenceBoost * 100)}%`,
      implicitBoost: implicitBoost !== 0 ? `${implicitBoost > 0 ? '+' : ''}${Math.round(implicitBoost * 100)}%` : 'none',
      combinedContext: combinedCtxBonus !== 0 ? `+${Math.round(combinedCtxBonus * 100)}% (${combinedCtx.reasons.join(', ')})` : 'none',
      photoVibe: photoVibeModifier !== 0 ? `+${Math.round(photoVibeModifier * 100)}% (${photoVibeLabel})` : 'none',
      pairFriendly: pairModifier !== 0 ? `+${Math.round(pairModifier * 100)}% (${pairLabel})` : 'none',
      seasonal: seasonalModifier !== 0 ? `+${Math.round(seasonalModifier * 100)}% (${seasonalLabel})` : 'none',
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
      mood_label: moodLabel,
      combined_context_bonus: combinedCtxBonus !== 0 ? combinedCtxBonus : null,
      combined_context_reasons: combinedCtx.reasons.length > 0 ? combinedCtx.reasons : null,
      occasion: occasionFromPrefs,
      priority_weights: priorityFromPrefs,
      photo_vibe_modifier: photoVibeModifier !== 0 ? photoVibeModifier : null,
      photo_vibe_matches: photoVibeResult.matchedVibes.length > 0 ? photoVibeResult.matchedVibes : null,
      photo_vibe_signals: photoVibeResult.photoVibeSignals.length > 0 ? photoVibeResult.photoVibeSignals : null,
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
