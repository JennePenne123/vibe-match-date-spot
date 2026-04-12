import { supabase } from '@/integrations/supabase/client';

/**
 * Area-to-vibe mapping: each area category maps to venue tags, vibes, and keywords
 * that boost matching when a user selects that area type
 */
export const AREA_VIBE_MAP: Record<string, { vibes: string[]; keywords: string[]; priceHint?: string[] }> = {
  'downtown': {
    vibes: ['trendy', 'urban', 'modern', 'lively', 'hip', 'bustling', 'energetic', 'vibrant', 'cosmopolitan', 'stylish', 'happening'],
    keywords: [
      'rooftop', 'lounge', 'cocktail', 'nightlife', 'club', 'skyline', 'downtown', 'zentrum', 'city', 'innenstadt',
      'bar', 'tapas', 'street food', 'food hall', 'neon', 'late night', 'dj', 'speakeasy', 'mixology',
      'happy hour', 'afterwork', 'penthouse', 'highrise', 'central', 'metropolitan', 'popup', 'brunch spot',
    ],
    priceHint: ['$$', '$$$'],
  },
  'waterfront': {
    vibes: ['scenic', 'relaxed', 'romantic', 'peaceful', 'chill', 'serene', 'breezy', 'idyllic', 'tranquil', 'coastal'],
    keywords: [
      'seafood', 'harbour', 'harbor', 'hafen', 'lake', 'see', 'river', 'water', 'sunset', 'terrace', 'outdoor',
      'pier', 'beach', 'boat', 'yacht', 'promenade', 'deck', 'ocean', 'marina', 'fish', 'oyster', 'sushi',
      'sundowner', 'biergarten', 'garden', 'canal', 'ufer', 'steg', 'panorama', 'view', 'aussicht', 'alster',
    ],
    priceHint: ['$$', '$$$'],
  },
  'arts-district': {
    vibes: ['creative', 'artsy', 'bohemian', 'cultural', 'eclectic', 'indie', 'underground', 'experimental', 'funky', 'unconventional', 'alternative'],
    keywords: [
      'gallery', 'jazz', 'live music', 'theater', 'museum', 'art', 'vintage', 'craft', 'studio', 'alternative',
      'poetry', 'slam', 'open mic', 'vinyl', 'bookshop', 'comic', 'tattoo', 'graffiti', 'street art', 'mural',
      'improv', 'cabaret', 'burlesque', 'atelier', 'werkstatt', 'kultur', 'szene', 'flea market', 'flohmarkt',
      'brewery', 'craft beer', 'natural wine', 'vegan', 'organic', 'second hand',
    ],
    priceHint: ['$', '$$'],
  },
  'oldtown': {
    vibes: ['cozy', 'charming', 'traditional', 'intimate', 'historic', 'rustic', 'nostalgic', 'warm', 'gemütlich', 'heimelig', 'klassisch'],
    keywords: [
      'wine', 'cafe', 'bistro', 'historic', 'altstadt', 'traditional', 'classic', 'old', 'brauhaus', 'tavern',
      'weinstube', 'kneipe', 'gasthof', 'ratskeller', 'candle', 'fireplace', 'kamin', 'cellar', 'gewölbe',
      'cobblestone', 'market square', 'marktplatz', 'church', 'dom', 'bakery', 'bäckerei', 'konditorei',
      'patisserie', 'tea', 'chocolate', 'fondue', 'raclette', 'regional', 'heimat', 'handmade', 'hausgemacht',
    ],
    priceHint: ['$$'],
  },
  'uptown': {
    vibes: ['upscale', 'elegant', 'sophisticated', 'premium', 'luxury', 'exclusive', 'refined', 'glamorous', 'chic', 'opulent', 'distinguished'],
    keywords: [
      'fine dining', 'michelin', 'champagne', 'gourmet', 'tasting', 'omakase', 'premium', 'exclusive', 'sterne',
      'caviar', 'truffle', 'wagyu', 'lobster', 'wine pairing', 'sommelier', 'degustation', 'prix fixe',
      'private dining', 'valet', 'concierge', 'terrace suite', 'rooftop bar', 'cigar', 'cognac', 'whisky',
      'spa', 'wellness', 'boutique', 'designer', 'five star', 'luxus', 'edel', 'haute cuisine', 'amuse bouche',
    ],
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
  if (preferredCuisines.some(c => vc.includes(c.toLowerCase()) || c.toLowerCase().includes(vc))) return 0.9;
  
  // Related cuisine groups - higher score for same family
  // Tighter cuisine groups - avoid false positives (e.g. german ≠ mediterranean)
  const cuisineGroups: Record<string, string[]> = {
    'asian': ['chinese', 'japanese', 'thai', 'korean', 'vietnamese', 'asian', 'sushi', 'ramen', 'wok', 'dim sum', 'curry'],
    'mediterranean': ['italian', 'greek', 'mediterranean', 'spanish', 'turkish', 'lebanese', 'moroccan'],
    'western_european': ['french', 'german', 'portuguese', 'european', 'regional', 'tarte flambee'],
    'american': ['american', 'burger', 'bbq', 'steakhouse', 'steak house', 'diner', 'grill'],
    'cafe': ['café', 'cafe', 'coffee', 'bakery', 'brunch', 'breakfast', 'patisserie'],
    'bar': ['bar', 'pub', 'cocktail', 'wine bar', 'lounge', 'biergarten'],
    'middle_eastern': ['persian', 'arabic', 'falafel', 'kebab', 'döner', 'oriental', 'syrian', 'lebanese', 'turkish', 'moroccan'],
    'latin': ['mexican', 'brazilian', 'peruvian', 'argentinian', 'tapas'],
  };
  
  for (const [, members] of Object.entries(cuisineGroups)) {
    const venueInGroup = members.some(m => vc.includes(m));
    const prefInGroup = preferredCuisines.some(p => members.some(m => p.toLowerCase().includes(m)));
    if (venueInGroup && prefInGroup) return 0.7;
  }
  
  return 0;
}

// Map user-facing price labels to venue price symbols
const PRICE_LABEL_TO_SYMBOL: Record<string, string[]> = {
  'budget': ['$'],
  'moderate': ['$', '$$'],
  'upscale': ['$$', '$$$'],
  'luxury': ['$$$', '$$$$'],
};

function normalizePricePreferences(pricePrefs: string[] | null): string[] {
  if (!pricePrefs?.length) return [];
  const symbols = new Set<string>();
  for (const p of pricePrefs) {
    const mapped = PRICE_LABEL_TO_SYMBOL[p.toLowerCase()];
    if (mapped) mapped.forEach(s => symbols.add(s));
    else symbols.add(p); // Already a symbol like "$$"
  }
  return Array.from(symbols);
}

// Blocklist: filter out non-dine-in venues (delivery, takeaway-only, supermarkets)
const VENUE_NAME_BLOCKLIST = [
  'lieferservice', 'lieferdienst', 'delivery', 'lieferando', 'wolt', 'uber eats',
  'just eat', 'flink', 'gorillas', 'getir', 'foodpanda', 'domino', 'pizza hut delivery',
  'netto', 'aldi', 'lidl', 'rewe', 'edeka', 'penny', 'kaufland',
  'takeaway', 'take away', 'zum mitnehmen', 'abhol',
];

const isBlockedVenue = (venue: any): boolean => {
  const name = (venue.name || '').toLowerCase();
  const desc = (venue.description || '').toLowerCase();
  const tags = (venue.tags || []).map((t: string) => t.toLowerCase());
  const searchText = [name, desc, ...tags].join(' ');
  return VENUE_NAME_BLOCKLIST.some(blocked => searchText.includes(blocked));
};

/**
 * Infer cuisine_type from venue name, address, tags, and description
 * when the original cuisine_type field is empty/null.
 * Returns the best-guess cuisine string or null if no inference is possible.
 */
const CUISINE_NAME_PATTERNS: Record<string, string[]> = {
  'italian': ['pizza', 'pasta', 'trattoria', 'ristorante', 'osteria', 'pizzeria', 'gelato', 'italiano'],
  'japanese': ['sushi', 'ramen', 'izakaya', 'tempura', 'yakitori', 'miso', 'udon', 'sake'],
  'chinese': ['wok', 'dim sum', 'dumpling', 'noodle', 'peking', 'szechuan', 'sichuan', 'canton'],
  'thai': ['thai', 'pad thai', 'tom yum', 'satay', 'green curry'],
  'indian': ['curry', 'tandoori', 'masala', 'naan', 'tikka', 'biryani', 'dal', 'samosa', 'indisch'],
  'mexican': ['taco', 'burrito', 'enchilada', 'quesadilla', 'guacamole', 'cantina', 'mexicano'],
  'turkish': ['kebab', 'döner', 'doner', 'kebap', 'pide', 'lahmacun', 'köfte', 'baklava', 'türkisch'],
  'greek': ['gyros', 'souvlaki', 'tzatziki', 'griechisch', 'greek', 'taverna', 'moussaka'],
  'vietnamese': ['pho', 'banh mi', 'vietnamesisch', 'vietnamese', 'bún'],
  'korean': ['bibimbap', 'kimchi', 'korean bbq', 'bulgogi', 'koreanisch'],
  'french': ['brasserie', 'bistrot', 'crêpe', 'croissant', 'patisserie', 'français', 'französisch'],
  'german': ['brauhaus', 'gasthof', 'wirtshaus', 'schnitzel', 'bratwurst', 'bierstube', 'ratskeller', 'deutsche küche'],
  'american': ['burger', 'bbq', 'barbecue', 'steakhouse', 'steak house', 'wings', 'diner', 'smokehouse'],
  'mediterranean': ['hummus', 'falafel', 'mezze', 'olive', 'mediterran'],
  'spanish': ['tapas', 'paella', 'churros', 'sangria', 'bodega'],
};

function inferCuisineFromVenue(venue: any): string | null {
  const name = (venue.name || '').toLowerCase();
  const desc = (venue.description || '').toLowerCase();
  const tags = (venue.tags || []).map((t: string) => t.toLowerCase());
  const address = (venue.address || '').toLowerCase();
  const searchText = [name, desc, ...tags, address].join(' ');
  
  let bestMatch: { cuisine: string; hits: number } | null = null;
  
  for (const [cuisine, patterns] of Object.entries(CUISINE_NAME_PATTERNS)) {
    const hits = patterns.filter(p => searchText.includes(p)).length;
    if (hits > 0 && (!bestMatch || hits > bestMatch.hits)) {
      bestMatch = { cuisine, hits };
    }
  }
  
  return bestMatch?.cuisine || null;
}


export interface SessionPriorityWeights {
  cuisine?: number;
  vibe?: number;
  price?: number;
  location?: number;
}

export const filterVenuesByPreferences = async (userId: string, venues: any[], selectedArea?: string, priorityWeights?: SessionPriorityWeights) => {
  try {
    // Pre-filter: remove delivery services and supermarkets
    const filteredVenues = venues.filter(v => {
      if (isBlockedVenue(v)) {
        console.log(`🚫 PREFERENCE FILTER: Blocked non-venue: ${v.name}`);
        return false;
      }
      return true;
    });
    console.log('🎯 PREFERENCE FILTER: Filtering', filteredVenues.length, 'venues (blocked', venues.length - filteredVenues.length, 'non-venues) for user:', userId);
    
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefsError || !userPrefs) {
      console.log('⚠️ PREFERENCE FILTER: No preferences found, returning all venues');
      return venues;
    }

    // Normalize price preferences from labels to symbols
    const normalizedPricePrefs = normalizePricePreferences(userPrefs.preferred_price_range as string[] | null);

    console.log('🎯 PREFERENCE FILTER: User preferences:', {
      cuisines: userPrefs.preferred_cuisines,
      priceRanges: userPrefs.preferred_price_range,
      priceSymbols: normalizedPricePrefs,
      vibes: userPrefs.preferred_vibes,
    });

    // Infer vibes from cuisine type to enrich sparse venue data
    const CUISINE_VIBE_INFERENCE: Record<string, string[]> = {
      'italian': ['romantic', 'casual', 'cozy'],
      'french': ['romantic', 'elegant', 'upscale'],
      'thai': ['casual', 'adventurous', 'exotic'],
      'chinese': ['casual', 'adventurous', 'family-friendly'],
      'japanese': ['trendy', 'modern', 'casual'],
      'mediterranean': ['casual', 'outdoor', 'relaxed'],
      'mexican': ['casual', 'lively', 'fun'],
      'indian': ['adventurous', 'casual', 'exotic'],
      'german': ['casual', 'cozy', 'traditional'],
      'american': ['casual', 'fun', 'lively'],
      'korean': ['trendy', 'adventurous', 'casual'],
      'vietnamese': ['casual', 'adventurous', 'trendy'],
    };

    // Infer price range from cuisine type
    const CUISINE_PRICE_INFERENCE: Record<string, string[]> = {
      'italian': ['$$', '$$$'],
      'french': ['$$$', '$$$$'],
      'thai': ['$', '$$'],
      'chinese': ['$', '$$'],
      'japanese': ['$$', '$$$'],
      'mediterranean': ['$$', '$$$'],
      'mexican': ['$', '$$'],
      'german': ['$$'],
      'american': ['$$'],
    };

    // Score all venues - don't filter out, just rank
    const scoredVenues = filteredVenues.map(venue => {
      let score = 0;
      let maxPossible = 0; // Track what's actually evaluable
      let primaryMatchFound = false; // Track if main signal matches
      const hasCuisinePrefs = (userPrefs.preferred_cuisines?.length || 0) > 0;
      const hasPricePrefs = (userPrefs.preferred_price_range?.length || 0) > 0;
      const hasVibePrefs = (userPrefs.preferred_vibes?.length || 0) > 0;

      // === PREFERENCE-BASED TAG ENRICHMENT ===
      // Infer missing venue attributes from what we know
      let effectiveCuisine = (venue.cuisine_type || '').toLowerCase();
      
      // If cuisine_type is missing, infer from name/tags/description
      if (!effectiveCuisine) {
        const inferred = inferCuisineFromVenue(venue);
        if (inferred) {
          effectiveCuisine = inferred;
          console.log(`🔍 INFERRED CUISINE: "${venue.name}" → ${inferred}`);
        }
      }
      
      let inferredVibes: string[] = [];
      let inferredPriceRange: string[] = [];

      for (const [cuisine, vibes] of Object.entries(CUISINE_VIBE_INFERENCE)) {
        if (effectiveCuisine.includes(cuisine)) {
          inferredVibes = vibes;
          break;
        }
      }
      for (const [cuisine, prices] of Object.entries(CUISINE_PRICE_INFERENCE)) {
        if (effectiveCuisine.includes(cuisine)) {
          inferredPriceRange = prices;
          break;
        }
      }

      // Priority weight multipliers (default 1.0 if not set)
      const pw = {
        cuisine: priorityWeights?.cuisine ?? 1.0,
        vibe: priorityWeights?.vibe ?? 1.0,
        price: priorityWeights?.price ?? 1.0,
        location: priorityWeights?.location ?? 1.0,
      };

      // Cuisine matching (base 40% × priority weight)
      const cuisineBase = 40 * pw.cuisine;
      if (hasCuisinePrefs && effectiveCuisine) {
        maxPossible += cuisineBase;
        const cuisineScore = cuisineMatchScore(effectiveCuisine, userPrefs.preferred_cuisines || []);
        if (cuisineScore > 0) {
          score += cuisineScore * cuisineBase;
          primaryMatchFound = true;
        } else {
          score -= 15 * pw.cuisine;
        }
      }

      // Price range matching (base 25% × priority weight)
      const priceBase = 25 * pw.price;
      const effectivePrice = venue.price_range || (inferredPriceRange.length > 0 ? inferredPriceRange[0] : null);
      if (hasPricePrefs && effectivePrice) {
        maxPossible += priceBase;
        if (normalizedPricePrefs.includes(effectivePrice)) {
          score += priceBase;
        } else {
          const priceOrder = ['$', '$$', '$$$', '$$$$'];
          const venueIdx = priceOrder.indexOf(effectivePrice);
          const prefIdxes = normalizedPricePrefs.map((p: string) => priceOrder.indexOf(p));
          const minDist = Math.min(...prefIdxes.map((pi: number) => Math.abs(pi - venueIdx)));
          if (minDist === 1) score += priceBase * 0.6;
          else score -= 3 * pw.price;
        }
      }

      // Vibe/tag matching (base 15% × priority weight)
      const vibeBase = 15 * pw.vibe;
      if (hasVibePrefs) {
        maxPossible += vibeBase;
        const venueTags = (venue.tags || []).map((t: string) => t.toLowerCase());
        const allVibes = [...venueTags, ...inferredVibes]; // Enrich with inferred vibes
        const prefVibes = userPrefs.preferred_vibes.map((v: string) => v.toLowerCase());
        const vibeMatches = allVibes.filter((tag: string) => 
          prefVibes.some((vibe: string) => tag.includes(vibe) || vibe.includes(tag))
        );
        if (vibeMatches.length > 0) {
          score += Math.min(vibeBase, vibeMatches.length * 6 * pw.vibe);
        } else {
          // Soft inference from price/cuisine as last resort
          let inferred = false;
          if (prefVibes.includes('casual') && (effectivePrice === '$' || effectivePrice === '$$')) {
            score += 10;
            inferred = true;
          }
          if (prefVibes.includes('romantic') && (effectivePrice === '$$$' || effectivePrice === '$$$$' ||
              effectiveCuisine.includes('italian') || effectiveCuisine.includes('french'))) {
            score += 10;
            inferred = true;
          }
          if (prefVibes.includes('adventurous') && (
            effectiveCuisine.includes('thai') || effectiveCuisine.includes('chinese') || 
            effectiveCuisine.includes('korean') || effectiveCuisine.includes('indian') ||
            effectiveCuisine.includes('vietnamese') || effectiveCuisine.includes('japanese'))) {
            score += 10;
            inferred = true;
          }
          if (prefVibes.includes('outdoor') && venueTags.some((t: string) => 
            t.includes('outdoor') || t.includes('terrace') || t.includes('garden') || 
            t.includes('biergarten') || t.includes('terrasse'))) {
            score += 10;
            inferred = true;
          }
          if (!inferred) score -= 2; // Very mild penalty (was -4)
        }
      }

      // Activity matching (10% weight)
      if (userPrefs.preferred_activities?.length && venue.tags) {
        maxPossible += 10;
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

      // Venue type matching (10% weight)
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
        if (typeMatch) {
          maxPossible += 10;
          score += 10;
        }
      }

      // Rating bonus (10% weight) — confidence-weighted by review count
      if (venue.rating) {
        maxPossible += 10;
        const reviewCount = venue.review_count || venue.reviewCount || venue.user_ratings_total || 0;
        const REVIEW_CONFIDENCE_THRESHOLD = 20;
        const confidence = reviewCount > 0 
          ? Math.min(reviewCount / REVIEW_CONFIDENCE_THRESHOLD, 1.0) 
          : 0.5; // No review data = neutral confidence
        
        // Bayesian effective rating: blend toward mean (3.5) with low review counts
        const MEAN_RATING = 3.5;
        const effectiveRating = reviewCount > 0
          ? (venue.rating * confidence + MEAN_RATING * (1 - confidence))
          : venue.rating;
        
        if (effectiveRating >= 4.0) score += 10 * confidence;
        else if (effectiveRating >= 3.5) score += 5 * confidence;
        else if (effectiveRating < 3.0) score -= 3; // Penalty for poor ratings
        
        // Social proof bonus for well-reviewed venues
        if (reviewCount >= 50 && venue.rating >= 4.0) score += 3;
      }

      // Dietary compatibility bonus (5%)
      if (userPrefs.dietary_restrictions?.length && venue.tags) {
        maxPossible += 5;
        const searchText = [...venue.tags, venue.description || ''].map((s: string) => s.toLowerCase()).join(' ');
        const dietMatch = (userPrefs.dietary_restrictions as string[]).some((diet: string) => 
          searchText.includes(diet.toLowerCase().replace('_', ' '))
        );
        if (dietMatch) score += 5;
      }

      // Area/neighborhood vibe matching (10% weight)
      if (selectedArea && AREA_VIBE_MAP[selectedArea]) {
        maxPossible += 10;
        const areaConfig = AREA_VIBE_MAP[selectedArea];
        const searchText = [
          ...(venue.tags || []), venue.name || '', venue.description || '', venue.address || '', venue.cuisine_type || ''
        ].map((s: string) => s.toLowerCase()).join(' ');

        const keywordHits = areaConfig.keywords.filter(kw => searchText.includes(kw));
        if (keywordHits.length > 0) score += Math.min(7, keywordHits.length * 3);

        const vibeHits = areaConfig.vibes.filter(v => searchText.includes(v));
        if (vibeHits.length > 0) score += Math.min(3, vibeHits.length * 2);

        if (areaConfig.priceHint?.includes(venue.price_range)) score += 2;
      }

      // === PERSONALITY-BASED SCORING (8% weight) ===
      const personalityTraits = userPrefs.personality_traits as { spontaneity?: number; adventure?: number; social_energy?: number } | null;
      if (personalityTraits) {
        maxPossible += 8;
        const venueTags = (venue.tags || []).map((t: string) => t.toLowerCase());
        const venueText = [...venueTags, (venue.name || '').toLowerCase(), (venue.description || '').toLowerCase(), effectiveCuisine].join(' ');
        
        // Adventure score (0-100) → boost exotic/unusual venues
        const adventure = personalityTraits.adventure ?? 50;
        if (adventure >= 70) {
          // Adventurous users: boost exotic cuisines and unique experiences
          const exoticKeywords = ['exotic', 'fusion', 'unique', 'experience', 'erlebnis', 'unusual', 'hidden', 'secret', 'authentic'];
          const exoticCuisines = ['thai', 'indian', 'korean', 'vietnamese', 'mexican', 'turkish', 'ethiopian', 'peruvian'];
          const isExotic = exoticKeywords.some(k => venueText.includes(k)) || exoticCuisines.some(c => effectiveCuisine.includes(c));
          if (isExotic) score += 5;
        } else if (adventure <= 30) {
          // Comfort-seekers: boost familiar, cozy venues
          const comfortKeywords = ['classic', 'traditional', 'cozy', 'gemütlich', 'home', 'familiar', 'regional'];
          const comfortCuisines = ['german', 'italian', 'french', 'american'];
          const isComfort = comfortKeywords.some(k => venueText.includes(k)) || comfortCuisines.some(c => effectiveCuisine.includes(c));
          if (isComfort) score += 5;
        }
        
        // Social energy (0-100) → intimate vs. lively
        const socialEnergy = personalityTraits.social_energy ?? 50;
        if (socialEnergy >= 70) {
          const livelyKeywords = ['lively', 'buzzing', 'popular', 'group', 'party', 'bar', 'club', 'live music', 'biergarten', 'food hall'];
          if (livelyKeywords.some(k => venueText.includes(k))) score += 3;
        } else if (socialEnergy <= 30) {
          const intimateKeywords = ['intimate', 'quiet', 'small', 'hidden', 'private', 'cozy', 'gemütlich', 'candlelight', 'wine bar'];
          if (intimateKeywords.some(k => venueText.includes(k))) score += 3;
        }
      }

      // === RELATIONSHIP GOAL SCORING (5% weight) ===
      const relationshipGoal = userPrefs.relationship_goal as string | null;
      if (relationshipGoal) {
        maxPossible += 5;
        const venueTags = (venue.tags || []).map((t: string) => t.toLowerCase());
        const venueText = [...venueTags, (venue.name || '').toLowerCase(), (venue.description || '').toLowerCase()].join(' ');
        const venuePrice = venue.price_range || '';
        
        const goalSignals: Record<string, { keywords: string[]; priceHint?: string[]; cuisineHint?: string[] }> = {
          'romantic': {
            keywords: ['romantic', 'candlelight', 'intimate', 'cozy', 'wine', 'cocktail', 'terrace', 'rooftop', 'fine dining', 'date night'],
            priceHint: ['$$', '$$$', '$$$$'],
            cuisineHint: ['italian', 'french', 'japanese', 'mediterranean', 'spanish'],
          },
          'friendship': {
            keywords: ['casual', 'fun', 'group', 'bar', 'pub', 'burger', 'pizza', 'bowling', 'karaoke', 'biergarten', 'street food', 'brunch'],
            priceHint: ['$', '$$'],
          },
          'networking': {
            keywords: ['upscale', 'business', 'lounge', 'hotel', 'premium', 'wine bar', 'cocktail', 'rooftop', 'conference'],
            priceHint: ['$$$', '$$$$'],
          },
          'selfcare': {
            keywords: ['spa', 'wellness', 'quiet', 'peaceful', 'café', 'cafe', 'tea', 'reading', 'garden', 'nature'],
            priceHint: ['$$', '$$$'],
          },
        };
        
        const signals = goalSignals[relationshipGoal];
        if (signals) {
          let goalScore = 0;
          if (signals.keywords.some(k => venueText.includes(k))) goalScore += 3;
          if (signals.priceHint?.includes(venuePrice)) goalScore += 1;
          if (signals.cuisineHint?.some(c => effectiveCuisine.includes(c))) goalScore += 1;
          score += goalScore;
        }
      }

      // === PRIMARY MATCH BOOST ===
      // If the strongest signal (cuisine) matches well, ensure a minimum score floor
      // This prevents good matches from being dragged down by sparse secondary data
      if (primaryMatchFound) {
        const cuisineScore = cuisineMatchScore(effectiveCuisine || venue.cuisine_type, userPrefs.preferred_cuisines || []);
        // Higher floors: exact match should already be in the 80%+ range
        const matchFloor = cuisineScore >= 0.9 ? 82 : cuisineScore >= 0.7 ? 72 : 58;
        // Normalize, then apply floor
        const effectiveMax = Math.max(maxPossible, 20);
        const rawNormalized = Math.max(2, (score / effectiveMax) * 100);
        // Add secondary signal bonus on top of floor for differentiation
        const secondaryBonus = Math.max(0, rawNormalized - matchFloor) * 0.5;
        const normalizedScore = Math.max(rawNormalized, matchFloor + secondaryBonus);
        
        const scoredVenue = {
          ...venue,
          preferenceScore: Math.min(98, normalizedScore),
          _debugScoring: { rawScore: score, maxPossible, effectiveMax, matchFloor, primaryMatchFound },
        };

        if (!scoredVenue.venue_id && (venue.id || venue.placeId)) {
          scoredVenue.venue_id = venue.id || venue.placeId;
        }

        return scoredVenue;
      }

      // --- NORMALIZED SCORING (no primary match) ---
      const effectiveMax = Math.max(maxPossible, 20);
      const normalizedScore = Math.max(2, Math.min(100, (score / effectiveMax) * 100));

      const scoredVenue = {
        ...venue,
        preferenceScore: normalizedScore,
        _debugScoring: { rawScore: score, maxPossible, effectiveMax, primaryMatchFound },
      };

      if (!scoredVenue.venue_id && (venue.id || venue.placeId)) {
        scoredVenue.venue_id = venue.id || venue.placeId;
      }

      return scoredVenue;
    });

    // Sort by preference score, return ALL venues (no filtering threshold)
    const sorted = scoredVenues.sort((a, b) => b.preferenceScore - a.preferenceScore);

    console.log(`🎯 PREFERENCE FILTER: Scored ${filteredVenues.length} venues`);
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
    // Pre-filter: remove delivery services and supermarkets
    const filteredVenues = venues.filter(v => !isBlockedVenue(v));
    console.log('🤝 COLLABORATIVE FILTER: Filtering', filteredVenues.length, 'venues (blocked', venues.length - filteredVenues.length, ') for users:', userId, 'and', partnerId);
    
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
      return filterVenuesByPreferences(userId, filteredVenues);
    }

    const collaborativeScoredVenues = filteredVenues.map(venue => {
      // Infer cuisine if missing
      const effectiveCuisine = venue.cuisine_type || inferCuisineFromVenue(venue) || '';
      
      // Fuzzy cuisine scoring for both users
      const userCuisineScore = cuisineMatchScore(effectiveCuisine, userPrefs.preferred_cuisines || []);
      const partnerCuisineScore = cuisineMatchScore(effectiveCuisine, partnerPrefs.preferred_cuisines || []);
      
      let userScore = userCuisineScore * 40;
      let partnerScore = partnerCuisineScore * 40;
      let sharedScore = 0;

      // Shared cuisine bonus
      if (userCuisineScore > 0 && partnerCuisineScore > 0) {
        sharedScore += 50 * Math.min(userCuisineScore, partnerCuisineScore);
      }

      // Price matching - normalize labels to symbols
      const userNormalizedPrices = normalizePricePreferences(userPrefs.preferred_price_range as string[] | null);
      const partnerNormalizedPrices = normalizePricePreferences(partnerPrefs.preferred_price_range as string[] | null);
      const userPriceMatch = venue.price_range && userNormalizedPrices.includes(venue.price_range);
      const partnerPriceMatch = venue.price_range && partnerNormalizedPrices.includes(venue.price_range);
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
