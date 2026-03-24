/**
 * Repeat-Visit Protection & Discovery Bonus
 * Penalizes already-visited venues and rewards discovering new ones.
 */

import { supabase } from '@/integrations/supabase/client';

interface RepeatResult {
  modifier: number; // negative for repeats, positive for discovery
  reason: string | null;
  visitCount: number;
}

// Cache visited venue IDs per user for the session
let cachedUserId: string | null = null;
let cachedVisitedVenues: Map<string, number> = new Map();
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

async function getVisitedVenues(userId: string): Promise<Map<string, number>> {
  const now = Date.now();
  if (cachedUserId === userId && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedVisitedVenues;
  }

  const visited = new Map<string, number>();

  try {
    // Count completed dates per venue from invitations
    const { data: invitations } = await supabase
      .from('date_invitations')
      .select('venue_id')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq('date_status', 'completed')
      .not('venue_id', 'is', null);

    if (invitations) {
      for (const inv of invitations) {
        if (inv.venue_id) {
          visited.set(inv.venue_id, (visited.get(inv.venue_id) || 0) + 1);
        }
      }
    }

    // Also check positive feedback as "visited"
    const { data: feedback } = await supabase
      .from('user_venue_feedback')
      .select('venue_id')
      .eq('user_id', userId)
      .eq('feedback_type', 'visited');

    if (feedback) {
      for (const fb of feedback) {
        if (!visited.has(fb.venue_id)) {
          visited.set(fb.venue_id, 1);
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ REPEAT-PROTECTION: Failed to fetch visit history:', e);
  }

  cachedUserId = userId;
  cachedVisitedVenues = visited;
  cacheTimestamp = now;

  return visited;
}

/**
 * Calculate repeat/discovery modifier for a venue.
 * - Already visited 1x: -5 penalty (slight demotion)
 * - Already visited 2+: -10 penalty (strong demotion)
 * - Never visited + high score: +3 discovery bonus
 */
export async function getRepeatProtectionModifier(
  userId: string,
  venueId: string,
  currentScore: number
): Promise<RepeatResult> {
  const visited = await getVisitedVenues(userId);
  const visitCount = visited.get(venueId) || 0;

  if (visitCount >= 2) {
    return { modifier: -10, reason: 'Schon mehrfach besucht', visitCount };
  }

  if (visitCount === 1) {
    return { modifier: -5, reason: 'Bereits besucht', visitCount };
  }

  // Discovery bonus for high-scoring new venues
  if (currentScore >= 75) {
    return { modifier: 3, reason: 'Neuentdeckung für dich', visitCount: 0 };
  }

  return { modifier: 0, reason: null, visitCount: 0 };
}

/**
 * Get total unique venues visited (for gamification / display)
 */
export async function getUniqueVenuesVisited(userId: string): Promise<number> {
  const visited = await getVisitedVenues(userId);
  return visited.size;
}
