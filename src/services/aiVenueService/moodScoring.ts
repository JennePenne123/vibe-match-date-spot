import { getTodayMood, type DailyMood } from '@/utils/moodStorage';

/**
 * Mood-based scoring modifiers
 * Adjusts venue scores based on the user's daily mood check-in
 */

interface MoodModifiers {
  vibeBoosts: Record<string, number>;
  priceBoosts: Record<string, number>;
  cuisineBoosts: Record<string, number>;
  tagBoosts: Record<string, number>;
}

const MOOD_PROFILES: Record<DailyMood, MoodModifiers> = {
  great: {
    // Feeling great → adventurous, upscale, exciting
    vibeBoosts: { adventurous: 0.08, nightlife: 0.06, cultural: 0.04 },
    priceBoosts: { '$$$': 0.04, '$$$$': 0.06 },
    cuisineBoosts: { japanese: 0.03, french: 0.03, korean: 0.03 },
    tagBoosts: { 'live music': 0.04, 'cocktails': 0.04, 'rooftop': 0.05, 'trendy': 0.04 },
  },
  okay: {
    // Feeling okay → casual, familiar, comfortable
    vibeBoosts: { casual: 0.08, romantic: 0.04 },
    priceBoosts: { '$$': 0.06, '$': 0.04 },
    cuisineBoosts: { italian: 0.03, american: 0.03, mediterranean: 0.03 },
    tagBoosts: { 'cozy': 0.05, 'family-friendly': 0.04, 'comfort food': 0.04 },
  },
  'me-time': {
    // Need me-time → quiet, relaxing, peaceful
    vibeBoosts: { outdoor: 0.08, casual: 0.04 },
    priceBoosts: { '$$': 0.04, '$': 0.04 },
    cuisineBoosts: { mediterranean: 0.03, thai: 0.03 },
    tagBoosts: { 'quiet': 0.06, 'garden': 0.05, 'terrace': 0.05, 'wellness': 0.04, 'organic': 0.04 },
  },
};

/**
 * Calculate a mood-based score modifier for a venue
 * Returns a value between -0.05 and +0.15
 */
export const getMoodScoreModifier = (venue: {
  cuisine_type?: string | null;
  price_range?: string | null;
  tags?: string[] | null;
}): number => {
  const mood = getTodayMood();
  if (!mood) return 0;

  const profile = MOOD_PROFILES[mood];
  if (!profile) return 0;

  let modifier = 0;

  // Cuisine boost
  if (venue.cuisine_type) {
    const cuisine = venue.cuisine_type.toLowerCase();
    for (const [key, boost] of Object.entries(profile.cuisineBoosts)) {
      if (cuisine.includes(key)) {
        modifier += boost;
        break;
      }
    }
  }

  // Price boost
  if (venue.price_range) {
    const priceBoost = profile.priceBoosts[venue.price_range];
    if (priceBoost) modifier += priceBoost;
  }

  // Tag/vibe boosts
  if (venue.tags && venue.tags.length > 0) {
    const tagsLower = venue.tags.map(t => t.toLowerCase());

    // Vibe boosts
    for (const [vibe, boost] of Object.entries(profile.vibeBoosts)) {
      if (tagsLower.some(tag => tag.includes(vibe) || vibe.includes(tag))) {
        modifier += boost;
      }
    }

    // Tag-specific boosts
    for (const [tag, boost] of Object.entries(profile.tagBoosts)) {
      if (tagsLower.some(t => t.includes(tag))) {
        modifier += boost;
      }
    }
  }

  // Cap the modifier
  return Math.max(-0.05, Math.min(0.15, modifier));
};

/**
 * Get a human-readable explanation of the mood influence
 */
export const getMoodInfluenceLabel = (): string | null => {
  const mood = getTodayMood();
  if (!mood) return null;

  switch (mood) {
    case 'great':
      return 'Boosted for adventure & excitement';
    case 'okay':
      return 'Tuned for comfort & familiarity';
    case 'me-time':
      return 'Optimized for calm & relaxation';
    default:
      return null;
  }
};
