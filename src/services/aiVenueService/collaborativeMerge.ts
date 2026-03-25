/**
 * Smart Partner Preference Merge
 * 
 * Instead of simple averaging, this uses:
 * 1. Veto logic: if one partner excludes a cuisine, it's excluded
 * 2. Intersection-first for cuisines: shared preferences get priority
 * 3. Union for vibes: both partners' vibes are considered
 * 4. Conservative price: overlapping price ranges preferred
 * 5. Dietary union: all restrictions respected
 */

interface UserPreferences {
  preferred_cuisines?: string[] | null;
  excluded_cuisines?: string[] | null;
  preferred_vibes?: string[] | null;
  preferred_price_range?: string[] | null;
  preferred_times?: string[] | null;
  dietary_restrictions?: string[] | null;
  preferred_activities?: string[] | null;
  preferred_venue_types?: string[] | null;
  lifestyle_data?: any;
}

export interface MergedPreferences {
  cuisines: string[];
  excludedCuisines: string[];
  vibes: string[];
  priceRange: string[];
  times: string[];
  dietary: string[];
  activities: string[];
  venueTypes: string[];
  mergeQuality: 'excellent' | 'good' | 'compromised';
  mergeDetails: {
    sharedCuisines: string[];
    sharedVibes: string[];
    sharedPriceRange: string[];
    vetoedCuisines: string[];
  };
}

/**
 * Smartly merge two users' preferences for collaborative scoring.
 */
export function mergePartnerPreferences(
  userPrefs: UserPreferences,
  partnerPrefs: UserPreferences
): MergedPreferences {
  // ── 1. Cuisines: Intersection-first with union fallback ──
  const userCuisines = (userPrefs.preferred_cuisines || []).map(c => c.toLowerCase());
  const partnerCuisines = (partnerPrefs.preferred_cuisines || []).map(c => c.toLowerCase());

  const sharedCuisines = userCuisines.filter(c => partnerCuisines.includes(c));
  // If intersection is non-empty, prioritize it; otherwise union
  const mergedCuisines = sharedCuisines.length > 0
    ? [...sharedCuisines, ...userCuisines.filter(c => !sharedCuisines.includes(c)), ...partnerCuisines.filter(c => !sharedCuisines.includes(c) && !userCuisines.includes(c))]
    : [...new Set([...userCuisines, ...partnerCuisines])];

  // ── 2. Veto logic: excluded cuisines from EITHER partner ──
  const userExcluded = (userPrefs.excluded_cuisines || []).map(c => c.toLowerCase());
  const partnerExcluded = (partnerPrefs.excluded_cuisines || []).map(c => c.toLowerCase());
  const allExcluded = [...new Set([...userExcluded, ...partnerExcluded])];

  // Remove vetoed cuisines from merged list
  const finalCuisines = mergedCuisines.filter(c => !allExcluded.includes(c));

  // ── 3. Vibes: Union (both feel comfortable) ──
  const userVibes = (userPrefs.preferred_vibes || []).map(v => v.toLowerCase());
  const partnerVibes = (partnerPrefs.preferred_vibes || []).map(v => v.toLowerCase());
  const sharedVibes = userVibes.filter(v => partnerVibes.includes(v));
  // Shared vibes first (higher priority in scoring), then unique ones
  const mergedVibes = [
    ...sharedVibes,
    ...userVibes.filter(v => !sharedVibes.includes(v)),
    ...partnerVibes.filter(v => !sharedVibes.includes(v) && !userVibes.includes(v)),
  ];

  // ── 4. Price range: Intersection preferred, union fallback ──
  const userPrice = userPrefs.preferred_price_range || [];
  const partnerPrice = partnerPrefs.preferred_price_range || [];
  const sharedPrice = userPrice.filter(p => partnerPrice.includes(p));
  const mergedPrice = sharedPrice.length > 0
    ? sharedPrice
    : [...new Set([...userPrice, ...partnerPrice])];

  // ── 5. Times: Intersection for scheduling compatibility ──
  const userTimes = userPrefs.preferred_times || [];
  const partnerTimes = partnerPrefs.preferred_times || [];
  const sharedTimes = userTimes.filter(t => partnerTimes.includes(t));
  const mergedTimes = sharedTimes.length > 0 ? sharedTimes : [...new Set([...userTimes, ...partnerTimes])];

  // ── 6. Dietary: Union (respect all restrictions) ──
  const mergedDietary = [...new Set([
    ...(userPrefs.dietary_restrictions || []),
    ...(partnerPrefs.dietary_restrictions || []),
  ])];

  // ── 7. Activities & Venue Types: Union ──
  const mergedActivities = [...new Set([
    ...(userPrefs.preferred_activities || []),
    ...(partnerPrefs.preferred_activities || []),
  ])];
  const mergedVenueTypes = [...new Set([
    ...(userPrefs.preferred_venue_types || []),
    ...(partnerPrefs.preferred_venue_types || []),
  ])];

  // ── Merge quality assessment ──
  const overlapScore =
    (sharedCuisines.length > 0 ? 1 : 0) +
    (sharedVibes.length > 0 ? 1 : 0) +
    (sharedPrice.length > 0 ? 1 : 0);

  const mergeQuality: MergedPreferences['mergeQuality'] =
    overlapScore >= 3 ? 'excellent' :
    overlapScore >= 1 ? 'good' :
    'compromised';

  return {
    cuisines: finalCuisines,
    excludedCuisines: allExcluded,
    vibes: mergedVibes,
    priceRange: mergedPrice,
    times: mergedTimes,
    dietary: mergedDietary,
    activities: mergedActivities,
    venueTypes: mergedVenueTypes,
    mergeQuality,
    mergeDetails: {
      sharedCuisines,
      sharedVibes,
      sharedPriceRange: sharedPrice,
      vetoedCuisines: allExcluded,
    },
  };
}
