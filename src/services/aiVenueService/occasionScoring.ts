/**
 * Occasion-Based Scoring
 * Adjusts venue recommendations based on the date occasion/type.
 * E.g. "First Date" → casual, relaxed venues; "Anniversary" → fine dining, romantic.
 */

export type DateOccasion = 
  | 'first_date'
  | 'anniversary'
  | 'casual'
  | 'birthday'
  | 'friends_hangout'
  | 'special_celebration';

interface OccasionProfile {
  vibes: string[];
  cuisines: string[];
  priceBoost: string[];
  penalizePrices: string[];
  label: string;
}

const OCCASION_PROFILES: Record<DateOccasion, OccasionProfile> = {
  first_date: {
    vibes: ['casual', 'cozy', 'café', 'bistro', 'lounge', 'trendy', 'wine'],
    cuisines: ['italian', 'mediterranean', 'japanese', 'french'],
    priceBoost: ['$$', '$$$'],
    penalizePrices: ['$', '$$$$'],
    label: 'Erstes Date',
  },
  anniversary: {
    vibes: ['romantic', 'elegant', 'fine dining', 'rooftop', 'candlelight', 'wine', 'exclusive'],
    cuisines: ['french', 'italian', 'japanese', 'mediterranean'],
    priceBoost: ['$$$', '$$$$'],
    penalizePrices: ['$'],
    label: 'Jahrestag',
  },
  casual: {
    vibes: ['casual', 'outdoor', 'garden', 'bistro', 'street food', 'burger', 'pizza'],
    cuisines: ['american', 'mexican', 'thai', 'korean'],
    priceBoost: ['$', '$$'],
    penalizePrices: ['$$$$'],
    label: 'Entspannt',
  },
  birthday: {
    vibes: ['lively', 'cocktail', 'trendy', 'party', 'rooftop', 'lounge', 'live music'],
    cuisines: ['japanese', 'mexican', 'korean', 'italian'],
    priceBoost: ['$$', '$$$', '$$$$'],
    penalizePrices: [],
    label: 'Geburtstag',
  },
  friends_hangout: {
    vibes: ['casual', 'beer garden', 'biergarten', 'pub', 'bar', 'outdoor', 'lively', 'game'],
    cuisines: ['american', 'mexican', 'korean', 'thai'],
    priceBoost: ['$', '$$'],
    penalizePrices: ['$$$$'],
    label: 'Freunde-Treffen',
  },
  special_celebration: {
    vibes: ['elegant', 'exclusive', 'fine dining', 'wine', 'rooftop', 'champagne', 'tasting'],
    cuisines: ['french', 'japanese', 'italian', 'mediterranean'],
    priceBoost: ['$$$', '$$$$'],
    penalizePrices: ['$'],
    label: 'Besonderer Anlass',
  },
};

interface OccasionResult {
  bonus: number;
  penalty: number;
  reason: string | null;
}

/**
 * Calculate occasion-based score modifier for a venue.
 * Returns bonus (0-12) and penalty (0 to -8).
 */
export function getOccasionScore(
  venue: { cuisine_type?: string | null; price_range?: string | null; tags?: string[] | null; name?: string | null; description?: string | null },
  occasion: DateOccasion | null | undefined
): OccasionResult {
  if (!occasion) return { bonus: 0, penalty: 0, reason: null };

  const profile = OCCASION_PROFILES[occasion];
  if (!profile) return { bonus: 0, penalty: 0, reason: null };

  const venueTags = (venue.tags || []).map(t => t.toLowerCase());
  const venueText = [
    ...venueTags,
    (venue.cuisine_type || '').toLowerCase(),
    (venue.name || '').toLowerCase(),
    (venue.description || '').toLowerCase(),
  ].join(' ');

  let bonus = 0;
  let penalty = 0;

  // Vibe match (max +8)
  const vibeHits = profile.vibes.filter(v => venueText.includes(v));
  if (vibeHits.length > 0) {
    bonus += Math.min(vibeHits.length * 2, 8);
  }

  // Cuisine match (+3)
  if (venue.cuisine_type && profile.cuisines.some(c => venue.cuisine_type!.toLowerCase().includes(c))) {
    bonus += 3;
  }

  // Price boost (+2)
  if (venue.price_range && profile.priceBoost.includes(venue.price_range)) {
    bonus += 2;
  }

  // Price penalty (-4 to -8)
  if (venue.price_range && profile.penalizePrices.includes(venue.price_range)) {
    penalty = -4;
    // Stronger penalty for very mismatched prices (e.g. $ venue for anniversary)
    if (occasion === 'anniversary' && venue.price_range === '$') penalty = -8;
    if (occasion === 'first_date' && venue.price_range === '$$$$') penalty = -6;
  }

  const reason = bonus > 3 ? `Perfekt für: ${profile.label}` : null;

  return {
    bonus: Math.min(bonus, 12),
    penalty,
    reason,
  };
}
