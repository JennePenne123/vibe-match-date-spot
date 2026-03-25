/**
 * Context Combination Scoring
 * 
 * 1. Combined occasion+mood+priority scoring (synergy bonuses)
 * 2. Auto time-of-day/day-of-week context detection
 * 
 * Instead of treating occasion, mood, and priorities independently,
 * this module detects powerful combinations and applies synergy bonuses.
 */

import type { DateOccasion } from './occasionScoring';
import type { DailyMood } from '@/pages/MoodCheckIn';
import type { SessionPriorityWeights } from './preferenceFiltering';

interface VenueContext {
  cuisine_type?: string | null;
  price_range?: string | null;
  tags?: string[] | null;
  name?: string | null;
  description?: string | null;
}

interface CombinationResult {
  synergyBonus: number;     // 0–20 extra points
  autoContextBonus: number; // 0–10 from time detection
  reasons: string[];
}

// ── Synergy profiles: when occasion + mood align, amplify ──
interface SynergyRule {
  occasions: DateOccasion[];
  moods: DailyMood[];
  boost: {
    vibes: string[];
    priceRange: string[];
    cuisines: string[];
  };
  maxBonus: number;
  label: string;
}

const SYNERGY_RULES: SynergyRule[] = [
  {
    // Anniversary + Feeling great → ultra-romantic fine dining
    occasions: ['anniversary', 'special_celebration'],
    moods: ['great'],
    boost: {
      vibes: ['romantic', 'elegant', 'fine dining', 'exclusive', 'wine', 'candlelight', 'rooftop', 'tasting'],
      priceRange: ['$$$', '$$$$'],
      cuisines: ['french', 'japanese', 'italian', 'mediterranean'],
    },
    maxBonus: 18,
    label: 'Romantisches Highlight',
  },
  {
    // Casual/Friends + Okay mood → comfort food paradise
    occasions: ['casual', 'friends_hangout'],
    moods: ['okay'],
    boost: {
      vibes: ['casual', 'cozy', 'biergarten', 'pub', 'comfort', 'gemütlich', 'outdoor'],
      priceRange: ['$', '$$'],
      cuisines: ['american', 'mexican', 'italian', 'korean', 'thai'],
    },
    maxBonus: 15,
    label: 'Gemütlicher Abend',
  },
  {
    // First Date + Great mood → trendy & impressive
    occasions: ['first_date'],
    moods: ['great'],
    boost: {
      vibes: ['trendy', 'cocktail', 'rooftop', 'lounge', 'stylish', 'hip'],
      priceRange: ['$$', '$$$'],
      cuisines: ['japanese', 'italian', 'korean', 'french'],
    },
    maxBonus: 16,
    label: 'Perfekter erster Eindruck',
  },
  {
    // Birthday + Great mood → party & lively
    occasions: ['birthday'],
    moods: ['great'],
    boost: {
      vibes: ['lively', 'cocktail', 'party', 'live music', 'rooftop', 'trendy', 'karaoke'],
      priceRange: ['$$', '$$$', '$$$$'],
      cuisines: ['japanese', 'mexican', 'korean'],
    },
    maxBonus: 16,
    label: 'Party-Stimmung',
  },
  {
    // Any occasion + Me-time → calm & relaxing
    occasions: ['casual', 'first_date', 'friends_hangout'],
    moods: ['me-time'],
    boost: {
      vibes: ['quiet', 'garden', 'terrace', 'organic', 'wellness', 'café', 'nature'],
      priceRange: ['$$'],
      cuisines: ['mediterranean', 'thai', 'japanese'],
    },
    maxBonus: 12,
    label: 'Ruhige Auszeit',
  },
];

// ── Auto time context: detect what kind of venue fits NOW ──
interface AutoTimeContext {
  vibes: string[];
  cuisines: string[];
  priceHint: string[];
  label: string;
}

function getAutoTimeContext(): AutoTimeContext {
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay(); // 0=Sun, 5=Fri, 6=Sat

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;

  // Friday/Saturday evening → nightlife boost
  if ((dayOfWeek === 5 || dayOfWeek === 6) && hour >= 19) {
    return {
      vibes: ['nightlife', 'cocktail', 'bar', 'live music', 'trendy', 'rooftop', 'lounge'],
      cuisines: ['japanese', 'mexican', 'korean', 'spanish'],
      priceHint: ['$$', '$$$'],
      label: 'Wochenend-Abend',
    };
  }

  // Sunday morning/midday → brunch
  if (dayOfWeek === 0 && hour >= 9 && hour < 14) {
    return {
      vibes: ['brunch', 'café', 'garden', 'terrace', 'casual', 'family'],
      cuisines: ['american', 'mediterranean', 'italian'],
      priceHint: ['$$'],
      label: 'Sonntags-Brunch',
    };
  }

  // Weekday lunch → quick & casual
  if (!isWeekend && hour >= 11 && hour < 14) {
    return {
      vibes: ['casual', 'bistro', 'quick', 'bowl', 'salad', 'lunch'],
      cuisines: ['asian', 'vietnamese', 'thai', 'mediterranean'],
      priceHint: ['$', '$$'],
      label: 'Mittagspause',
    };
  }

  // Evening (general) → dinner-oriented
  if (hour >= 18 && hour < 21) {
    return {
      vibes: ['dinner', 'restaurant', 'wine', 'romantic', 'cozy'],
      cuisines: ['italian', 'french', 'japanese', 'mediterranean'],
      priceHint: ['$$', '$$$'],
      label: 'Abendessen',
    };
  }

  // Late night → street food & bars
  if (hour >= 22 || hour < 6) {
    return {
      vibes: ['late night', 'bar', 'street food', 'kebab', 'pizza', 'snack'],
      cuisines: ['turkish', 'mexican', 'american'],
      priceHint: ['$'],
      label: 'Late Night',
    };
  }

  // Default afternoon
  return {
    vibes: ['café', 'terrace', 'dessert', 'ice cream'],
    cuisines: [],
    priceHint: ['$', '$$'],
    label: 'Nachmittag',
  };
}

/**
 * Calculate combined context scoring with synergy bonuses.
 * This is the "whole is greater than the sum of parts" engine.
 */
export function getCombinedContextScore(
  venue: VenueContext,
  occasion: DateOccasion | null | undefined,
  mood: DailyMood | null | undefined,
  priorityWeights?: SessionPriorityWeights | null
): CombinationResult {
  const reasons: string[] = [];
  let synergyBonus = 0;
  let autoContextBonus = 0;

  const venueTags = (venue.tags || []).map(t => t.toLowerCase());
  const venueText = [
    ...venueTags,
    (venue.cuisine_type || '').toLowerCase(),
    (venue.name || '').toLowerCase(),
    (venue.description || '').toLowerCase(),
  ].join(' ');

  // ── 1. Synergy scoring ──
  if (occasion && mood) {
    for (const rule of SYNERGY_RULES) {
      if (!rule.occasions.includes(occasion) || !rule.moods.includes(mood)) continue;

      let hits = 0;

      // Vibe matches
      const vibeHits = rule.boost.vibes.filter(v => venueText.includes(v));
      hits += vibeHits.length;

      // Cuisine match
      if (venue.cuisine_type && rule.boost.cuisines.some(c => venue.cuisine_type!.toLowerCase().includes(c))) {
        hits += 2; // Cuisine is weighted higher
      }

      // Price match
      if (venue.price_range && rule.boost.priceRange.includes(venue.price_range)) {
        hits += 1;
      }

      if (hits >= 2) {
        // Apply priority weight amplification
        let amplifier = 1.0;
        if (priorityWeights) {
          // If user prioritizes food and this is a cuisine match, amplify
          if (venue.cuisine_type && rule.boost.cuisines.some(c => venue.cuisine_type!.toLowerCase().includes(c))) {
            amplifier *= (priorityWeights.cuisine || 1.0);
          }
          // If user prioritizes vibe and there are vibe hits
          if (vibeHits.length > 0) {
            amplifier *= (priorityWeights.vibe || 1.0);
          }
        }

        const rawBonus = Math.min(hits * 3, rule.maxBonus);
        synergyBonus = Math.max(synergyBonus, Math.round(rawBonus * amplifier));
        reasons.push(rule.label);
      }
    }
  }

  // ── 2. Auto time context ──
  const timeCtx = getAutoTimeContext();
  const timeVibeHits = timeCtx.vibes.filter(v => venueText.includes(v));
  if (timeVibeHits.length > 0) {
    autoContextBonus += Math.min(timeVibeHits.length * 2, 6);
  }
  if (venue.cuisine_type && timeCtx.cuisines.some(c => venue.cuisine_type!.toLowerCase().includes(c))) {
    autoContextBonus += 2;
  }
  if (venue.price_range && timeCtx.priceHint.includes(venue.price_range)) {
    autoContextBonus += 2;
  }
  autoContextBonus = Math.min(autoContextBonus, 10);

  if (autoContextBonus >= 4) {
    reasons.push(`Passt zum ${timeCtx.label}`);
  }

  return {
    synergyBonus: Math.min(synergyBonus, 20),
    autoContextBonus,
    reasons,
  };
}
