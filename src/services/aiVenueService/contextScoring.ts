/**
 * Real-time Context Scoring
 * Adjusts venue scores based on day-of-week, time-of-day, and season.
 */

interface ContextVenue {
  cuisine_type?: string | null;
  price_range?: string | null;
  tags?: string[] | null;
  name?: string | null;
  description?: string | null;
}

interface ContextResult {
  bonus: number;
  reasons: string[];
}

// ── Day-of-week profiles ──
const DAY_PROFILES: Record<number, { vibes: string[]; cuisines: string[]; priceBoost: string[]; label: string }> = {
  0: { vibes: ['brunch', 'casual', 'family', 'outdoor', 'garden'], cuisines: ['mediterranean', 'american', 'italian'], priceBoost: ['$$'], label: 'Sonntag' },
  1: { vibes: ['casual', 'quick', 'bistro', 'café'], cuisines: ['asian', 'vietnamese', 'thai'], priceBoost: ['$', '$$'], label: 'Montag' },
  2: { vibes: ['casual', 'cozy'], cuisines: [], priceBoost: ['$', '$$'], label: 'Dienstag' },
  3: { vibes: ['casual', 'trendy'], cuisines: [], priceBoost: ['$$'], label: 'Mittwoch' },
  4: { vibes: ['trendy', 'cocktail', 'wine', 'lounge'], cuisines: ['japanese', 'korean', 'french'], priceBoost: ['$$', '$$$'], label: 'Donnerstag' },
  5: { vibes: ['nightlife', 'cocktail', 'trendy', 'lively', 'rooftop', 'bar', 'live music'], cuisines: ['japanese', 'mexican', 'spanish', 'korean'], priceBoost: ['$$', '$$$', '$$$$'], label: 'Freitag' },
  6: { vibes: ['romantic', 'elegant', 'fine dining', 'rooftop', 'nightlife', 'cocktail', 'trendy'], cuisines: ['italian', 'french', 'japanese', 'mediterranean'], priceBoost: ['$$$', '$$$$'], label: 'Samstag' },
};

// ── Time-of-day profiles ──
interface TimeProfile { vibes: string[]; label: string }
function getTimeProfile(hour: number): TimeProfile {
  if (hour >= 6 && hour < 11) return { vibes: ['brunch', 'café', 'bakery', 'breakfast', 'coffee'], label: 'Morgen' };
  if (hour >= 11 && hour < 14) return { vibes: ['lunch', 'bistro', 'casual', 'quick', 'salad', 'bowl'], label: 'Mittag' };
  if (hour >= 14 && hour < 17) return { vibes: ['café', 'terrace', 'garden', 'ice cream', 'dessert'], label: 'Nachmittag' };
  if (hour >= 17 && hour < 20) return { vibes: ['dinner', 'restaurant', 'fine dining', 'romantic', 'wine'], label: 'Abend' };
  if (hour >= 20 && hour < 23) return { vibes: ['nightlife', 'bar', 'cocktail', 'lounge', 'live music', 'rooftop'], label: 'Nacht' };
  return { vibes: ['late night', 'bar', 'street food', 'kebab', 'pizza'], label: 'Spät' };
}

// ── Season profiles ──
function getSeasonProfile(month: number): { vibes: string[]; label: string } {
  if (month >= 3 && month <= 5) return { vibes: ['terrace', 'garden', 'outdoor', 'brunch', 'fresh'], label: 'Frühling' };
  if (month >= 6 && month <= 8) return { vibes: ['outdoor', 'rooftop', 'terrace', 'beer garden', 'biergarten', 'grill', 'bbq', 'ice cream', 'seafood'], label: 'Sommer' };
  if (month >= 9 && month <= 10) return { vibes: ['cozy', 'wine', 'harvest', 'seasonal', 'comfort food'], label: 'Herbst' };
  return { vibes: ['cozy', 'fireplace', 'kamin', 'fondue', 'raclette', 'warm', 'gemütlich', 'winter', 'glühwein'], label: 'Winter' };
}

/**
 * Calculate real-time context bonus for a venue.
 * Returns bonus (0-15) and human-readable reasons.
 */
export function getRealtimeContextScore(venue: ContextVenue): ContextResult {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  const month = now.getMonth(); // 0-indexed

  const dayProfile = DAY_PROFILES[dayOfWeek];
  const timeProfile = getTimeProfile(hour);
  const seasonProfile = getSeasonProfile(month);

  const venueTags = (venue.tags || []).map(t => t.toLowerCase());
  const venueText = [
    ...venueTags,
    (venue.cuisine_type || '').toLowerCase(),
    (venue.name || '').toLowerCase(),
    (venue.description || '').toLowerCase(),
  ].join(' ');

  let bonus = 0;
  const reasons: string[] = [];

  // Day-of-week vibe match (max +5)
  const dayVibeHits = dayProfile.vibes.filter(v => venueText.includes(v));
  if (dayVibeHits.length > 0) {
    bonus += Math.min(dayVibeHits.length * 2, 5);
    reasons.push(`Perfekt für ${dayProfile.label}`);
  }

  // Day-of-week cuisine match (+2)
  if (venue.cuisine_type && dayProfile.cuisines.some(c => venue.cuisine_type!.toLowerCase().includes(c))) {
    bonus += 2;
  }

  // Day-of-week price match (+2)
  if (venue.price_range && dayProfile.priceBoost.includes(venue.price_range)) {
    bonus += 2;
  }

  // Time-of-day match (max +4)
  const timeHits = timeProfile.vibes.filter(v => venueText.includes(v));
  if (timeHits.length > 0) {
    bonus += Math.min(timeHits.length * 2, 4);
    reasons.push(`Ideal für den ${timeProfile.label}`);
  }

  // Season match (max +4)
  const seasonHits = seasonProfile.vibes.filter(v => venueText.includes(v));
  if (seasonHits.length > 0) {
    bonus += Math.min(seasonHits.length * 2, 4);
    reasons.push(`${seasonProfile.label}-Highlight`);
  }

  return { bonus: Math.min(bonus, 15), reasons };
}
