import { supabase } from '@/integrations/supabase/client';

/**
 * Exploration vs. Exploitation Module
 * 
 * Prevents the AI from only recommending "safe" known preferences.
 * Adds a small randomized bonus to novel/unfamiliar categories
 * so users can discover new favorites they didn't know they'd like.
 * 
 * ~10% of score influence goes to exploration for balanced discovery.
 */

interface ExplorationResult {
  bonus: number;       // 0-8 points on 100-scale
  isExploration: boolean;
  reason: string | null;
}

// Seeded pseudo-random for deterministic per-session exploration
let sessionSeed: number | null = null;
function getSessionSeed(): number {
  if (sessionSeed === null) {
    // Same seed within a 30-minute window for consistency
    sessionSeed = Math.floor(Date.now() / (30 * 60 * 1000));
  }
  return sessionSeed;
}

function seededRandom(venueId: string): number {
  // Simple hash combining session seed and venue ID
  let hash = getSessionSeed();
  for (let i = 0; i < venueId.length; i++) {
    hash = ((hash << 5) - hash + venueId.charCodeAt(i)) | 0;
  }
  // Normalize to 0..1
  return Math.abs(Math.sin(hash) * 10000) % 1;
}

/**
 * Calculate exploration bonus for a venue.
 * Venues in unfamiliar categories get a small boost.
 * 
 * @param userId - Current user
 * @param venue - Venue to evaluate
 * @param userExploredCuisines - Cuisines the user has rated before
 */
export const getExplorationBonus = async (
  userId: string,
  venue: any,
  userExploredCuisines?: string[]
): Promise<ExplorationResult> => {
  try {
    // Fetch user's historical cuisines if not provided
    let exploredCuisines = userExploredCuisines;
    if (!exploredCuisines) {
      const { data: learningData } = await supabase
        .from('ai_learning_data')
        .select('venue_id')
        .eq('user_id', userId);

      if (learningData && learningData.length > 0) {
        const venueIds = learningData.map(d => d.venue_id);
        const { data: venues } = await supabase
          .from('venues')
          .select('cuisine_type')
          .in('id', venueIds);

        exploredCuisines = [...new Set(
          (venues || [])
            .map(v => v.cuisine_type?.toLowerCase())
            .filter(Boolean) as string[]
        )];
      } else {
        exploredCuisines = [];
      }
    }

    const venueCuisine = (venue.cuisine_type || '').toLowerCase();

    // Check if this venue's cuisine is unexplored
    const isNovelCuisine = venueCuisine && exploredCuisines.length > 0 &&
      !exploredCuisines.some(c => 
        venueCuisine.includes(c) || c.includes(venueCuisine)
      );

    // No exploration needed for users with < 3 ratings (not enough data to know what's "novel")
    if (exploredCuisines.length < 3) {
      return { bonus: 0, isExploration: false, reason: null };
    }

    if (!isNovelCuisine) {
      return { bonus: 0, isExploration: false, reason: null };
    }

    // Apply exploration bonus with controlled randomization
    // ~20% of novel venues get a meaningful boost (not all — that would be chaos)
    const randomFactor = seededRandom(venue.id || venueCuisine);

    if (randomFactor > 0.80) {
      // Strong exploration: this novel venue gets boosted
      const bonus = 5 + randomFactor * 3; // 5-8 points
      return {
        bonus,
        isExploration: true,
        reason: `🔍 Neuentdeckung: ${venue.cuisine_type} – etwas Neues für dich!`,
      };
    } else if (randomFactor > 0.60) {
      // Mild exploration
      return {
        bonus: 2 + randomFactor * 2, // 2-4 points
        isExploration: true,
        reason: `✨ Könnte dir gefallen: ${venue.cuisine_type}`,
      };
    }

    // No boost this time — exploitation wins
    return { bonus: 0, isExploration: false, reason: null };
  } catch (err) {
    console.error('Error calculating exploration bonus:', err);
    return { bonus: 0, isExploration: false, reason: null };
  }
};

/**
 * Batch-fetch explored cuisines for a user (call once, pass to getExplorationBonus).
 * Avoids N+1 queries when scoring many venues.
 */
export const getUserExploredCuisines = async (userId: string): Promise<string[]> => {
  try {
    const { data: learningData } = await supabase
      .from('ai_learning_data')
      .select('venue_id')
      .eq('user_id', userId);

    if (!learningData || learningData.length === 0) return [];

    const venueIds = [...new Set(learningData.map(d => d.venue_id))];
    const { data: venues } = await supabase
      .from('venues')
      .select('cuisine_type')
      .in('id', venueIds);

    return [...new Set(
      (venues || [])
        .map(v => v.cuisine_type?.toLowerCase())
        .filter(Boolean) as string[]
    )];
  } catch {
    return [];
  }
};
