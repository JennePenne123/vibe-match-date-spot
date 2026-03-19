import { supabase } from '@/integrations/supabase/client';

/**
 * Area-to-vibe mapping: each area category maps to venue tags, vibes, and keywords
 * that boost matching when a user selects that area type
 */
export const AREA_VIBE_MAP: Record<string, { vibes: string[]; keywords: string[]; priceHint?: string[] }> = {
  'downtown': {
    vibes: ['trendy', 'urban', 'modern', 'lively', 'hip', 'bustling'],
    keywords: ['rooftop', 'lounge', 'cocktail', 'nightlife', 'club', 'skyline', 'downtown', 'zentrum', 'city', 'innenstadt'],
    priceHint: ['$$', '$$$'],
  },
  'waterfront': {
    vibes: ['scenic', 'relaxed', 'romantic', 'peaceful', 'chill'],
    keywords: ['seafood', 'harbour', 'harbor', 'hafen', 'lake', 'see', 'river', 'water', 'sunset', 'terrace', 'outdoor', 'pier', 'beach'],
    priceHint: ['$$', '$$$'],
  },
  'arts-district': {
    vibes: ['creative', 'artsy', 'bohemian', 'cultural', 'eclectic', 'indie'],
    keywords: ['gallery', 'jazz', 'live music', 'theater', 'museum', 'art', 'vintage', 'craft', 'studio', 'alternative'],
    priceHint: ['$', '$$'],
  },
  'oldtown': {
    vibes: ['cozy', 'charming', 'traditional', 'intimate', 'historic', 'rustic'],
    keywords: ['wine', 'cafe', 'bistro', 'historic', 'altstadt', 'traditional', 'classic', 'old', 'brauhaus', 'tavern'],
    priceHint: ['$$'],
  },
  'uptown': {
    vibes: ['upscale', 'elegant', 'sophisticated', 'premium', 'luxury', 'exclusive'],
    keywords: ['fine dining', 'michelin', 'champagne', 'gourmet', 'tasting', 'omakase', 'premium', 'exclusive', 'sterne'],
    priceHint: ['$$$', '$$$$'],
  },
};

/**
 * Fuzzy cuisine matching - handles partial matches and related categories
 */
function cuisineMatchScore(venueCuisine: string | undefined, preferredCuisines: string[]): number {
  if (!venueCuisine || !preferredCuisines?.length) return 0;
  
  const vc = venueCuisine.toLowerCase().trim();
  
  // Exact match
  if (preferredCuisines.some(c => c.toLowerCase().trim() === vc)) return 1.0;
  
  // Partial / contains match (e.g. "Italian Restaurant" matches "Italian")
  if (preferredCuisines.some(c => vc.includes(c.toLowerCase()) || c.toLowerCase().includes(vc))) return 0.8;
  
  // Related cuisine groups
  const cuisineGroups: Record<string, string[]> = {
    'asian': ['chinese', 'japanese', 'thai', 'korean', 'vietnamese', 'asian', 'sushi', 'ramen', 'wok'],
    'european': ['italian', 'french', 'spanish', 'greek', 'mediterranean', 'german', 'portuguese'],
    'american': ['american', 'burger', 'bbq', 'steakhouse', 'diner', 'grill'],
    'cafe': ['café', 'cafe', 'coffee', 'bakery', 'brunch', 'breakfast'],
    'bar': ['bar', 'pub', 'cocktail', 'wine bar', 'lounge'],
  };
  
  for (const [, members] of Object.entries(cuisineGroups)) {
    const venueInGroup = members.some(m => vc.includes(m));
    const prefInGroup = preferredCuisines.some(p => members.some(m => p.toLowerCase().includes(m)));
    if (venueInGroup && prefInGroup) return 0.5;
  }
  
  return 0;
}

// Filter venues by user preferences to improve matching
export const filterVenuesByPreferences = async (userId: string, venues: any[]) => {
  try {
    console.log('🎯 PREFERENCE FILTER: Filtering', venues.length, 'venues for user:', userId);
    
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefsError || !userPrefs) {
      console.log('⚠️ PREFERENCE FILTER: No preferences found, returning all venues');
      return venues;
    }

    console.log('🎯 PREFERENCE FILTER: User preferences:', {
      cuisines: userPrefs.preferred_cuisines,
      priceRanges: userPrefs.preferred_price_range,
      vibes: userPrefs.preferred_vibes,
    });

    // Score all venues - don't filter out, just rank
    const scoredVenues = venues.map(venue => {
      let score = 0;
      const maxScore = 100;

      // Cuisine matching (30% weight) - fuzzy
      const cuisineScore = cuisineMatchScore(
        venue.cuisine_type, 
        userPrefs.preferred_cuisines || []
      );
      score += cuisineScore * 30;

      // Price range matching (20% weight)
      if (userPrefs.preferred_price_range?.includes(venue.price_range)) {
        score += 20;
      } else if (venue.price_range) {
        const priceOrder = ['$', '$$', '$$$', '$$$$'];
        const venueIdx = priceOrder.indexOf(venue.price_range);
        const prefIdxes = (userPrefs.preferred_price_range || []).map((p: string) => priceOrder.indexOf(p));
        const minDist = Math.min(...prefIdxes.map((pi: number) => Math.abs(pi - venueIdx)));
        if (minDist === 1) score += 12;
      }

      // Vibe/tag matching (15% weight) - fuzzy
      if (venue.tags && userPrefs.preferred_vibes?.length) {
        const venueTags = venue.tags.map((t: string) => t.toLowerCase());
        const prefVibes = userPrefs.preferred_vibes.map((v: string) => v.toLowerCase());
        const vibeMatches = venueTags.filter((tag: string) => 
          prefVibes.some((vibe: string) => tag.includes(vibe) || vibe.includes(tag))
        );
        if (vibeMatches.length > 0) {
          score += Math.min(15, vibeMatches.length * 8);
        }
      }

      // Activity matching (10% weight) - NEW
      if (userPrefs.preferred_activities?.length && venue.tags) {
        const activityTagMap: Record<string, string[]> = {
          'dining': ['restaurant', 'dining', 'food'],
          'cocktails': ['bar', 'cocktail', 'drinks', 'lounge'],
          'cultural_act': ['museum', 'gallery', 'art', 'theater'],
          'active': ['sport', 'bowling', 'climbing', 'fitness'],
          'nightlife_act': ['club', 'party', 'nightlife'],
        };
        const searchText = [...venue.tags, venue.cuisine_type || '', venue.description || '']
          .map((s: string) => s.toLowerCase()).join(' ');
        const actMatch = (userPrefs.preferred_activities as string[]).some((act: string) => {
          const keywords = activityTagMap[act] || [act.toLowerCase()];
          return keywords.some(kw => searchText.includes(kw));
        });
        if (actMatch) score += 10;
      }

      // Venue type matching (10% weight) - NEW
      if (userPrefs.preferred_venue_types?.length) {
        const venueTypeKeywords: Record<string, string[]> = {
          'museum': ['museum'], 'gallery': ['gallery', 'galerie'],
          'theater_venue': ['theater', 'theatre'], 'cinema': ['cinema', 'kino'],
          'bowling': ['bowling'], 'escape_room': ['escape room'],
          'climbing': ['climbing', 'klettern', 'bouldering'],
          'spa_wellness': ['spa', 'wellness', 'sauna'],
          'karaoke': ['karaoke'], 'comedy_club': ['comedy'],
          'arcade': ['arcade'], 'mini_golf': ['mini golf', 'minigolf'],
        };
        const searchText = [...(venue.tags || []), venue.name || '', venue.cuisine_type || '', venue.description || '']
          .map((s: string) => s.toLowerCase()).join(' ');
        const typeMatch = (userPrefs.preferred_venue_types as string[]).some((vt: string) => {
          const keywords = venueTypeKeywords[vt] || [vt.toLowerCase().replace('_', ' ')];
          return keywords.some(kw => searchText.includes(kw));
        });
        if (typeMatch) score += 10;
      }

      // Rating bonus (10% weight)
      if (venue.rating && venue.rating >= 4.0) {
        score += 10;
      } else if (venue.rating && venue.rating >= 3.5) {
        score += 5;
      }

      // Dietary compatibility bonus (5%) - NEW
      if (userPrefs.dietary_restrictions?.length && venue.tags) {
        const searchText = [...venue.tags, venue.description || ''].map((s: string) => s.toLowerCase()).join(' ');
        const dietMatch = (userPrefs.dietary_restrictions as string[]).some((diet: string) => 
          searchText.includes(diet.toLowerCase().replace('_', ' '))
        );
        if (dietMatch) score += 5;
      }

      // Base score - every venue gets at least 5 points
      score = Math.max(5, score);

      const scoredVenue = {
        ...venue,
        preferenceScore: (score / maxScore) * 100
      };

      if (!scoredVenue.venue_id && (venue.id || venue.placeId)) {
        scoredVenue.venue_id = venue.id || venue.placeId;
      }

      return scoredVenue;
    });

    // Sort by preference score, return ALL venues (no filtering threshold)
    const sorted = scoredVenues.sort((a, b) => b.preferenceScore - a.preferenceScore);

    console.log(`🎯 PREFERENCE FILTER: Scored ${venues.length} venues`);
    console.log('🎯 TOP MATCHES:', sorted.slice(0, 5).map(v => 
      `${v.name}: ${Math.round(v.preferenceScore)}%`
    ));
    console.log('🎯 BOTTOM MATCHES:', sorted.slice(-3).map(v => 
      `${v.name}: ${Math.round(v.preferenceScore)}%`
    ));

    // Return up to 30 venues to give variety
    return sorted.slice(0, 30);
  } catch (error) {
    console.error('❌ PREFERENCE FILTER: Error filtering venues:', error);
    return venues;
  }
};

// Enhanced collaborative preference filtering for two users
export const filterVenuesByCollaborativePreferences = async (
  userId: string, 
  partnerId: string, 
  venues: any[]
) => {
  try {
    console.log('🤝 COLLABORATIVE FILTER: Filtering for users:', userId, 'and', partnerId);
    
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: partnerPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', partnerId)
      .single();

    if (!userPrefs || !partnerPrefs) {
      console.log('⚠️ COLLABORATIVE FILTER: Missing preferences, using single user filter');
      return filterVenuesByPreferences(userId, venues);
    }

    const collaborativeScoredVenues = venues.map(venue => {
      // Fuzzy cuisine scoring for both users
      const userCuisineScore = cuisineMatchScore(venue.cuisine_type, userPrefs.preferred_cuisines || []);
      const partnerCuisineScore = cuisineMatchScore(venue.cuisine_type, partnerPrefs.preferred_cuisines || []);
      
      let userScore = userCuisineScore * 40;
      let partnerScore = partnerCuisineScore * 40;
      let sharedScore = 0;

      // Shared cuisine bonus
      if (userCuisineScore > 0 && partnerCuisineScore > 0) {
        sharedScore += 50 * Math.min(userCuisineScore, partnerCuisineScore);
      }

      // Price matching
      const userPriceMatch = userPrefs.preferred_price_range?.includes(venue.price_range);
      const partnerPriceMatch = partnerPrefs.preferred_price_range?.includes(venue.price_range);
      if (userPriceMatch) userScore += 30;
      if (partnerPriceMatch) partnerScore += 30;
      if (userPriceMatch && partnerPriceMatch) sharedScore += 30;

      // Vibe matching - fuzzy
      if (venue.tags) {
        const venueTags = venue.tags.map((t: string) => t.toLowerCase());
        const userVibes = (userPrefs.preferred_vibes || []).map((v: string) => v.toLowerCase());
        const partnerVibes = (partnerPrefs.preferred_vibes || []).map((v: string) => v.toLowerCase());
        
        const userVibeMatch = venueTags.some((tag: string) => 
          userVibes.some((v: string) => tag.includes(v) || v.includes(tag))
        );
        const partnerVibeMatch = venueTags.some((tag: string) => 
          partnerVibes.some((v: string) => tag.includes(v) || v.includes(tag))
        );
        
        if (userVibeMatch) userScore += 20;
        if (partnerVibeMatch) partnerScore += 20;
        if (userVibeMatch && partnerVibeMatch) sharedScore += 20;
      }

      const collaborativeScore = Math.max(5, (sharedScore * 1.5 + (userScore + partnerScore) * 0.5) / 2);

      const collaborativeVenue = {
        ...venue,
        collaborativeScore,
        userScore,
        partnerScore,
        sharedScore
      };

      if (!collaborativeVenue.venue_id && (venue.id || venue.placeId)) {
        collaborativeVenue.venue_id = venue.id || venue.placeId;
      }

      return collaborativeVenue;
    });

    const sorted = collaborativeScoredVenues
      .sort((a, b) => b.collaborativeScore - a.collaborativeScore);

    console.log(`🤝 COLLABORATIVE FILTER: Scored ${venues.length} venues`);
    console.log('🤝 TOP MATCHES:', sorted.slice(0, 5).map(v => 
      `${v.name}: ${Math.round(v.collaborativeScore)}% (shared: ${Math.round(v.sharedScore)}%)`
    ));

    return sorted.slice(0, 30);
  } catch (error) {
    console.error('❌ COLLABORATIVE FILTER: Error:', error);
    return filterVenuesByPreferences(userId, venues);
  }
};
