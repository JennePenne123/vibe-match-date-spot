/**
 * Seasonal Specials Scoring (Signal #17)
 * 
 * Boosts venues with currently active seasonal specials (Winterterrasse, Sommergarten, etc.)
 * Provides freshness factor to keep recommendations dynamic.
 */

export interface SeasonalSpecial {
  id: string;
  title: string;
  description?: string;
  emoji?: string;
  startDate: string; // ISO date
  endDate: string;   // ISO date
  tags?: string[];    // Additional vibe tags this special adds
}

/** Predefined seasonal special templates */
export const SEASONAL_TEMPLATES = [
  { title: 'Winterterrasse', emoji: '❄️', tags: ['winter', 'outdoor', 'cozy', 'gemütlich'] },
  { title: 'Sommergarten', emoji: '☀️', tags: ['summer', 'outdoor', 'garden', 'terrasse'] },
  { title: 'Weihnachtsmenü', emoji: '🎄', tags: ['christmas', 'festlich', 'fine-dining'] },
  { title: 'Valentinstag-Special', emoji: '💕', tags: ['valentinstag', 'romantic', 'date-night'] },
  { title: 'Grillsaison', emoji: '🔥', tags: ['grill', 'bbq', 'outdoor', 'summer'] },
  { title: 'Oktoberfest-Spezial', emoji: '🍺', tags: ['oktoberfest', 'bavarian', 'lively'] },
  { title: 'Brunch-Saison', emoji: '🥐', tags: ['brunch', 'weekend', 'casual'] },
  { title: 'Live-Musik-Abende', emoji: '🎵', tags: ['live-musik', 'entertainment', 'lively'] },
  { title: 'Rooftop Opening', emoji: '🌆', tags: ['rooftop', 'outdoor', 'trendy'] },
  { title: 'Kaminabende', emoji: '🪵', tags: ['fireplace', 'cozy', 'romantic', 'winter'] },
];

/**
 * Get currently active seasonal specials for a venue
 */
export const getActiveSpecials = (specials: SeasonalSpecial[] | null | undefined): SeasonalSpecial[] => {
  if (!specials || !Array.isArray(specials)) return [];
  
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return specials.filter(s => s.startDate <= now && s.endDate >= now);
};

/**
 * Calculate seasonal special score modifier
 * Returns 0 if no active specials, up to +0.08 with active specials
 */
export const getSeasonalScoreModifier = (
  specials: SeasonalSpecial[] | null | undefined,
  userPreferredVibes?: string[] | null
): { modifier: number; activeSpecials: SeasonalSpecial[]; matchedTags: string[] } => {
  const active = getActiveSpecials(specials);
  
  if (active.length === 0) {
    return { modifier: 0, activeSpecials: [], matchedTags: [] };
  }

  let modifier = 0;
  const matchedTags: string[] = [];

  // Base freshness bonus for having any active special (+0.03)
  modifier += 0.03;

  // Vibe matching bonus: if special tags match user vibes
  if (userPreferredVibes && userPreferredVibes.length > 0) {
    const userVibesLower = userPreferredVibes.map(v => v.toLowerCase());
    
    for (const special of active) {
      const specialTags = special.tags || [];
      for (const tag of specialTags) {
        if (userVibesLower.some(v => tag.includes(v) || v.includes(tag))) {
          if (!matchedTags.includes(tag)) {
            matchedTags.push(tag);
            modifier += 0.015;
          }
        }
      }
    }
  }

  // Multiple active specials small bonus
  if (active.length >= 2) {
    modifier += 0.01;
  }

  return {
    modifier: Math.min(modifier, 0.08),
    activeSpecials: active,
    matchedTags,
  };
};

/**
 * Get human-readable seasonal label
 */
export const getSeasonalLabel = (activeSpecials: SeasonalSpecial[]): string | null => {
  if (activeSpecials.length === 0) return null;
  const names = activeSpecials.map(s => `${s.emoji || '🌟'} ${s.title}`);
  return names.slice(0, 2).join(', ');
};
