/**
 * Temporal Decay Module
 * 
 * Applies exponential decay to historical ratings so recent feedback
 * carries more weight than old feedback. This allows user preferences
 * to evolve naturally over time — "Geschmäcker ändern sich."
 * 
 * Half-life: 90 days (a rating from 3 months ago has ~50% influence)
 */

const HALF_LIFE_DAYS = 90;
const DECAY_CONSTANT = Math.LN2 / HALF_LIFE_DAYS; // ~0.0077

/**
 * Calculate decay factor for a given age in days.
 * Returns 0..1 where 1 = brand new, 0.5 = 90 days old, ~0 = very old.
 */
export const getTemporalDecayFactor = (ageDays: number): number => {
  if (ageDays <= 0) return 1.0;
  return Math.exp(-DECAY_CONSTANT * ageDays);
};

/**
 * Calculate decay factor from a date string.
 */
export const getDecayFromDate = (dateStr: string): number => {
  const ageMs = Date.now() - new Date(dateStr).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return getTemporalDecayFactor(ageDays);
};

/**
 * Apply temporal decay to an array of weighted items.
 * Returns the decay-weighted average.
 */
export const decayWeightedAverage = (
  items: Array<{ value: number; date: string }>
): number => {
  if (items.length === 0) return 0;

  let weightedSum = 0;
  let totalWeight = 0;

  for (const item of items) {
    const decay = getDecayFromDate(item.date);
    weightedSum += item.value * decay;
    totalWeight += decay;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
};

/**
 * Calculate effective feature weights with temporal decay applied.
 * More recent successful predictions carry more influence.
 * 
 * @param historicalWeights Array of weight snapshots with timestamps
 * @param currentWeights Current weights as baseline
 * @returns Decay-adjusted weights
 */
export const applyTemporalDecayToWeights = (
  historicalWeights: Array<{ weights: Record<string, number>; date: string; rating: number }>,
  currentWeights: Record<string, number>
): Record<string, number> => {
  if (historicalWeights.length === 0) return currentWeights;

  const adjustedWeights = { ...currentWeights };
  const weightKeys = Object.keys(currentWeights);

  for (const key of weightKeys) {
    // Collect all historical values for this weight with decay
    const historicalValues = historicalWeights
      .filter(h => h.weights[key] !== undefined)
      .map(h => ({
        value: h.weights[key],
        date: h.date,
        decay: getDecayFromDate(h.date),
        // Rating intensity: 5-star and 1-star have more impact
        intensity: Math.abs(h.rating - 3) / 2, // 0..1
      }));

    if (historicalValues.length === 0) continue;

    // Decay-weighted drift calculation
    // Shows how much the preference has shifted over time
    let driftSum = 0;
    let driftWeight = 0;

    for (const hv of historicalValues) {
      const effectiveWeight = hv.decay * (0.5 + hv.intensity);
      driftSum += (hv.value - 1.0) * effectiveWeight; // Drift from neutral
      driftWeight += effectiveWeight;
    }

    if (driftWeight > 0) {
      const avgDrift = driftSum / driftWeight;
      // Blend current weight with historical drift (70% current, 30% historical)
      adjustedWeights[key] = Math.max(0.3, Math.min(2.5,
        currentWeights[key] * 0.7 + (1.0 + avgDrift) * 0.3
      ));
    }
  }

  return adjustedWeights;
};
