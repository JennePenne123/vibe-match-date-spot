/**
 * Smart Partner Preference Merge
 * 
 * Instead of simple averaging, this uses:
 * 1. Veto logic: if one partner excludes a cuisine, it's excluded
 * 2. Intersection-first for cuisines: shared preferences get priority
 * 3. Union for vibes: both partners' vibes are considered
 * 4. Conservative price: overlapping price ranges preferred
 * 5. Dietary union: all restrictions respected
 * 
 * Group scoring (3+ people) uses Consensus + Veto:
 * - Hard veto: dietary/excluded cuisines filter venues entirely
 * - Minimum guarantee: every person must score ≥ 50% (adjustable)
 * - Rawlsian fairness: optimize the lowest individual score
 * - Harmony bonus: low variance across scores = better pick
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
 * Given individual scores for each group member, compute a fair consensus score.
 * 
 * Strategy:
 * - If ANY member scores below VETO_THRESHOLD → venue is vetoed (returns 0)
 * - Otherwise: weighted blend of min-score (Rawlsian fairness) + average
 * - Harmony bonus for low variance (everyone equally happy)
 * - Slight uplift when min score is high (everyone genuinely likes it)
 */
export const VETO_THRESHOLD = 0.30; // 30% — hard floor, nobody gets something they hate
export const MIN_ACCEPTABLE = 0.50; // 50% — soft floor for "acceptable" quality

export function computeGroupConsensusScore(individualScores: number[]): {
  finalScore: number;
  isVetoed: boolean;
  minScore: number;
  avgScore: number;
  harmonyBonus: number;
  qualityLabel: string;
} {
  if (individualScores.length === 0) {
    return { finalScore: 0, isVetoed: true, minScore: 0, avgScore: 0, harmonyBonus: 0, qualityLabel: 'no_data' };
  }

  const n = individualScores.length;
  const minScore = Math.min(...individualScores);
  const maxScore = Math.max(...individualScores);
  const avgScore = individualScores.reduce((a, b) => a + b, 0) / n;

  // Hard veto: if anyone scores below threshold → reject
  if (minScore < VETO_THRESHOLD) {
    return { finalScore: 0, isVetoed: true, minScore, avgScore, harmonyBonus: 0, qualityLabel: 'vetoed' };
  }

  // Variance: how spread out are the scores? (0 = perfect consensus)
  const variance = individualScores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  // Harmony bonus: reward low variance (max +10% when everyone agrees)
  const harmonyBonus = Math.max(0, 0.10 * (1 - stdDev / 0.5));

  // Rawlsian blend: 40% weight on minimum score, 60% on average
  // This lifts venues where the "least happy" person is still reasonably satisfied
  const rawlsianBlend = (minScore * 0.4) + (avgScore * 0.6);

  // Quality uplift: if even the least happy person scores ≥ 70%, bonus
  const qualityUplift = minScore >= 0.70 ? 0.05 : 0;

  const finalScore = Math.min(0.98, rawlsianBlend + harmonyBonus + qualityUplift);

  // Label for UI/reasoning
  let qualityLabel: string;
  if (minScore >= 0.70 && stdDev < 0.10) qualityLabel = 'perfect_consensus';
  else if (minScore >= MIN_ACCEPTABLE && stdDev < 0.20) qualityLabel = 'good_consensus';
  else if (minScore >= MIN_ACCEPTABLE) qualityLabel = 'acceptable';
  else qualityLabel = 'compromised';

  return { finalScore, isVetoed: false, minScore, avgScore, harmonyBonus, qualityLabel };
}

/**
 * Get a German-language explanation of the consensus result for AI reasoning.
 */
export function getConsensusReasoningLabel(result: ReturnType<typeof computeGroupConsensusScore>, memberCount: number): string {
  if (result.isVetoed) return `⛔ Für mind. 1 Person ungeeignet`;
  
  switch (result.qualityLabel) {
    case 'perfect_consensus':
      return `🎯 Perfekter Konsens – alle ${memberCount} Personen begeistert`;
    case 'good_consensus':
      return `✅ Guter Kompromiss für alle ${memberCount} Personen`;
    case 'acceptable':
      return `👍 Akzeptabel für alle, aber kein Highlight`;
    case 'compromised':
      return `⚠️ Kompromiss – nicht alle gleich zufrieden`;
    default:
      return `Gruppen-Score für ${memberCount} Personen`;
  }
}

/**
 * Smartly merge two users' preferences for collaborative scoring.
 */
export function mergePartnerPreferences(
  userPrefs: UserPreferences,
  partnerPrefs: UserPreferences
): MergedPreferences {
  return mergeMultiplePreferences([userPrefs, partnerPrefs]);
}

/**
 * Merge N users' preferences for group date scoring (2-6 people).
 * Uses frequency-based ranking, veto logic, and union for restrictions.
 */
export function mergeMultiplePreferences(
  allPrefs: UserPreferences[]
): MergedPreferences {
  if (allPrefs.length === 0) {
    return {
      cuisines: [], excludedCuisines: [], vibes: [], priceRange: [], times: [],
      dietary: [], activities: [], venueTypes: [],
      mergeQuality: 'compromised',
      mergeDetails: { sharedCuisines: [], sharedVibes: [], sharedPriceRange: [], vetoedCuisines: [] },
    };
  }

  const n = allPrefs.length;

  // Helper: count frequency and rank items by popularity across all members
  const rankByFrequency = (field: keyof UserPreferences): { ranked: string[]; shared: string[] } => {
    const counts: Record<string, number> = {};
    for (const pref of allPrefs) {
      const arr = ((pref[field] as string[]) || []).map(s => s.toLowerCase());
      for (const item of arr) {
        counts[item] = (counts[item] || 0) + 1;
      }
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const shared = sorted.filter(([, count]) => count >= Math.ceil(n / 2)).map(([item]) => item);
    const ranked = sorted.map(([item]) => item);
    return { ranked, shared };
  };

  // ── 1. Cuisines: frequency-ranked, shared first ──
  const cuisineResult = rankByFrequency('preferred_cuisines');

  // ── 2. Veto logic: excluded cuisines from ANY member ──
  const allExcluded = [...new Set(
    allPrefs.flatMap(p => (p.excluded_cuisines || []).map(c => c.toLowerCase()))
  )];
  const finalCuisines = cuisineResult.ranked.filter(c => !allExcluded.includes(c));

  // ── 3. Vibes: shared first, then rest by frequency ──
  const vibeResult = rankByFrequency('preferred_vibes');
  const mergedVibes = [
    ...vibeResult.shared,
    ...vibeResult.ranked.filter(v => !vibeResult.shared.includes(v)),
  ];

  // ── 4. Price range: intersection preferred ──
  const priceResult = rankByFrequency('preferred_price_range');

  // ── 5. Times: shared availability ──
  const timeResult = rankByFrequency('preferred_times');

  // ── 6. Dietary: union (respect ALL restrictions) ──
  const mergedDietary = [...new Set(
    allPrefs.flatMap(p => p.dietary_restrictions || [])
  )];

  // ── 7. Activities & Venue Types: union ──
  const mergedActivities = [...new Set(
    allPrefs.flatMap(p => p.preferred_activities || [])
  )];
  const mergedVenueTypes = [...new Set(
    allPrefs.flatMap(p => p.preferred_venue_types || [])
  )];

  // ── Merge quality assessment ──
  const overlapScore =
    (cuisineResult.shared.length > 0 ? 1 : 0) +
    (vibeResult.shared.length > 0 ? 1 : 0) +
    (priceResult.shared.length > 0 ? 1 : 0);

  const mergeQuality: MergedPreferences['mergeQuality'] =
    overlapScore >= 3 ? 'excellent' :
    overlapScore >= 1 ? 'good' :
    'compromised';

  return {
    cuisines: finalCuisines,
    excludedCuisines: allExcluded,
    vibes: mergedVibes,
    priceRange: priceResult.shared.length > 0 ? priceResult.shared : priceResult.ranked,
    times: timeResult.shared.length > 0 ? timeResult.shared : timeResult.ranked,
    dietary: mergedDietary,
    activities: mergedActivities,
    venueTypes: mergedVenueTypes,
    mergeQuality,
    mergeDetails: {
      sharedCuisines: cuisineResult.shared,
      sharedVibes: vibeResult.shared,
      sharedPriceRange: priceResult.shared,
      vetoedCuisines: allExcluded,
    },
  };
}
