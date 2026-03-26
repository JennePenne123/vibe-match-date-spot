/**
 * Pair-Friendly Scoring (Signal #16)
 * 
 * Boosts venues that have pair-friendly features when in collaborative/date mode.
 * Uses: pair_friendly_features, has_separee, capacity, best_times
 */

interface PairScoringInput {
  pair_friendly_features?: string[] | null;
  has_separee?: boolean | null;
  capacity?: number | null;
  best_times?: Record<string, string[]> | null;
  tags?: string[] | null;
}

/**
 * Calculate a pair-friendly score modifier for collaborative date planning.
 * Returns 0 for solo mode, up to +0.15 for highly pair-optimized venues.
 */
export const getPairFriendlyScoreModifier = (
  venue: PairScoringInput,
  isCollaborative: boolean
): { modifier: number; reasons: string[] } => {
  if (!isCollaborative) {
    return { modifier: 0, reasons: [] };
  }

  let modifier = 0;
  const reasons: string[] = [];

  // Pair-friendly features (strongest signal, up to +0.06)
  const features = venue.pair_friendly_features || [];
  if (features.length > 0) {
    const featureBonus = Math.min(features.length * 0.015, 0.06);
    modifier += featureBonus;

    // Premium features get extra boost
    const premiumFeatures = ['candle_lit', 'private_room', 'fireplace', 'view_table'];
    const premiumCount = features.filter(f => premiumFeatures.includes(f)).length;
    if (premiumCount > 0) {
      modifier += premiumCount * 0.01;
      reasons.push('Premium-Paar-Setting');
    } else {
      reasons.push(`${features.length} Paar-Features`);
    }
  }

  // Separée available (+0.03)
  if (venue.has_separee) {
    modifier += 0.03;
    reasons.push('Separée verfügbar');
  }

  // Capacity sweet spot: 20-80 seats is ideal for dates (not too empty, not too crowded)
  if (venue.capacity) {
    if (venue.capacity >= 20 && venue.capacity <= 80) {
      modifier += 0.02;
      reasons.push('Ideale Größe für Dates');
    } else if (venue.capacity < 20) {
      modifier += 0.015; // Very intimate, slightly less bonus
      reasons.push('Sehr intim');
    }
    // Large venues (>80) get no bonus — could feel impersonal
  }

  // Best times with "romantic" mood set (+0.02)
  if (venue.best_times && typeof venue.best_times === 'object') {
    const romanticTimes = (venue.best_times as Record<string, string[]>).romantic || [];
    if (romanticTimes.length > 0) {
      // Check if current time matches a romantic time slot
      const now = new Date();
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDay = dayNames[now.getDay()];
      const currentHour = now.getHours();
      const currentSlot = currentHour < 15 ? 'lunch' : 'evening';
      const currentTimeSlot = `${currentDay}_${currentSlot}`;

      if (romanticTimes.includes(currentTimeSlot)) {
        modifier += 0.03;
        reasons.push('Jetzt romantische Zeit');
      } else {
        modifier += 0.01; // Has romantic times but not now
        reasons.push('Romantische Zeiten verfügbar');
      }
    }
  }

  // Tag-based romantic signals (small additional boost)
  const tags = (venue.tags || []).map(t => t.toLowerCase());
  const romanticTags = ['romantisch', 'romantic', 'date-night', 'candlelight', 'intimate', 'paar-empfehlung'];
  const matchedRomanticTags = romanticTags.filter(rt => tags.some(t => t.includes(rt)));
  if (matchedRomanticTags.length > 0) {
    modifier += Math.min(matchedRomanticTags.length * 0.01, 0.02);
  }

  // Cap total modifier
  return {
    modifier: Math.min(modifier, 0.15),
    reasons: reasons.slice(0, 3),
  };
};

/**
 * Get human-readable pair-friendly label
 */
export const getPairFriendlyLabel = (reasons: string[]): string | null => {
  if (reasons.length === 0) return null;
  return `💑 ${reasons.join(' · ')}`;
};
