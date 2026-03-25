import { supabase } from '@/integrations/supabase/client';
import { calculateGeoDistance } from '@/utils/stringUtils';

export interface DistanceToleranceResult {
  /** Score modifier based on learned distance preference (-5 to +5) */
  bonus: number;
  /** Human-readable reason for the score adjustment */
  reason: string | null;
  /** Learned optimal distance in km (null if not enough data) */
  optimalDistanceKm: number | null;
  /** Confidence level 0-1 based on data points */
  confidence: number;
}

/**
 * Learns the user's distance tolerance from past date ratings.
 * Compares venue distances to ratings to find the "sweet spot" distance.
 * 
 * Approach:
 * 1. Fetch past learning data with venue locations
 * 2. Correlate distance → rating to find optimal range
 * 3. Score current venue based on how close it is to the sweet spot
 */
export async function getDistanceToleranceScore(
  userId: string,
  venueLatitude: number | undefined | null,
  venueLongitude: number | undefined | null,
  userLocation?: { latitude: number; longitude: number } | null
): Promise<DistanceToleranceResult> {
  const noEffect: DistanceToleranceResult = { bonus: 0, reason: null, optimalDistanceKm: null, confidence: 0 };

  if (!venueLatitude || !venueLongitude || !userLocation?.latitude || !userLocation?.longitude) {
    return noEffect;
  }

  try {
    // Fetch past learning data with venue IDs
    const { data: learningData } = await supabase
      .from('ai_learning_data')
      .select('venue_id, actual_rating, context_data')
      .eq('user_id', userId)
      .not('actual_rating', 'is', null)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!learningData || learningData.length < 3) {
      return noEffect; // Need at least 3 data points
    }

    // Extract distance data from context_data (stored during feedback)
    const distanceRatings: Array<{ distanceKm: number; rating: number }> = [];

    for (const entry of learningData) {
      const ctx = entry.context_data as Record<string, any> | null;
      const distanceKm = ctx?.venue_distance_km;
      if (typeof distanceKm === 'number' && entry.actual_rating) {
        distanceRatings.push({ distanceKm, rating: entry.actual_rating });
      }
    }

    if (distanceRatings.length < 3) {
      return noEffect; // Not enough geo-tagged ratings
    }

    // Calculate average rating per distance bucket
    // Buckets: 0-1km, 1-3km, 3-5km, 5-10km, 10+km
    const buckets = [
      { label: '0-1km', min: 0, max: 1, ratings: [] as number[] },
      { label: '1-3km', min: 1, max: 3, ratings: [] as number[] },
      { label: '3-5km', min: 3, max: 5, ratings: [] as number[] },
      { label: '5-10km', min: 5, max: 10, ratings: [] as number[] },
      { label: '10+km', min: 10, max: Infinity, ratings: [] as number[] },
    ];

    for (const dr of distanceRatings) {
      const bucket = buckets.find(b => dr.distanceKm >= b.min && dr.distanceKm < b.max);
      if (bucket) bucket.ratings.push(dr.rating);
    }

    // Find the bucket with the highest average rating (sweet spot)
    let bestBucket = buckets[0];
    let bestAvg = 0;
    for (const bucket of buckets) {
      if (bucket.ratings.length === 0) continue;
      const avg = bucket.ratings.reduce((a, b) => a + b, 0) / bucket.ratings.length;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestBucket = bucket;
      }
    }

    if (bestBucket.ratings.length === 0) return noEffect;

    // Calculate optimal distance as the midpoint of the best bucket
    const optimalDistanceKm = bestBucket.max === Infinity
      ? bestBucket.min + 5
      : (bestBucket.min + bestBucket.max) / 2;

    // Calculate distance of current venue from user
    const currentDistanceKm = calculateGeoDistance(
      userLocation.latitude, userLocation.longitude,
      venueLatitude, venueLongitude
    );

    // Confidence based on total data points (max at 10+)
    const confidence = Math.min(distanceRatings.length / 10, 1.0);

    // Score: how close is this venue to the optimal distance range?
    const isInSweetSpot = currentDistanceKm >= bestBucket.min && currentDistanceKm < bestBucket.max;
    const distanceFromOptimal = Math.abs(currentDistanceKm - optimalDistanceKm);

    let bonus = 0;
    let reason: string | null = null;

    if (isInSweetSpot) {
      // Venue is in the user's preferred distance range
      bonus = 4 * confidence;
      reason = `In deiner bevorzugten Entfernung (${bestBucket.label})`;
    } else if (distanceFromOptimal <= 2) {
      // Close to optimal
      bonus = 2 * confidence;
      reason = `Nah an deiner Lieblingsentfernung`;
    } else if (distanceFromOptimal > 5 && bestAvg >= 4) {
      // Far from where user tends to rate highly
      bonus = -3 * confidence;
      reason = null; // Don't show negative reasons
    }

    return { bonus, reason, optimalDistanceKm, confidence };
  } catch (err) {
    console.error('⚠️ Distance tolerance learning error:', err);
    return noEffect;
  }
}
