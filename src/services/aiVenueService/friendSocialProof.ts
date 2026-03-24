/**
 * Friend Social Proof
 * Boosts venues that the user's friends have visited and rated positively.
 * "3 deiner Freunde waren hier" → engagement + trust signal.
 */

import { supabase } from '@/integrations/supabase/client';

interface FriendProofResult {
  bonus: number;
  friendCount: number;
  reason: string | null;
}

// Session cache
let friendVenueCache: { userId: string; data: Map<string, number>; ts: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 min

/**
 * Build a map of venueId → number of friends who visited it.
 */
async function getFriendVenueMap(userId: string): Promise<Map<string, number>> {
  const now = Date.now();
  if (friendVenueCache && friendVenueCache.userId === userId && (now - friendVenueCache.ts) < CACHE_TTL) {
    return friendVenueCache.data;
  }

  const venueMap = new Map<string, number>();

  try {
    // Step 1: Get accepted friends
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (!friendships || friendships.length === 0) {
      friendVenueCache = { userId, data: venueMap, ts: now };
      return venueMap;
    }

    const friendIds = friendships.map(f => f.user_id === userId ? f.friend_id : f.user_id);

    // Step 2: Get completed dates for all friends (batch query)
    const { data: friendDates } = await supabase
      .from('date_invitations')
      .select('venue_id, sender_id, recipient_id')
      .eq('date_status', 'completed')
      .not('venue_id', 'is', null)
      .or(friendIds.map(id => `sender_id.eq.${id},recipient_id.eq.${id}`).join(','));

    if (friendDates) {
      for (const date of friendDates) {
        if (!date.venue_id) continue;
        // Only count if one of our friends was involved
        const isFriendDate = friendIds.includes(date.sender_id) || friendIds.includes(date.recipient_id);
        if (isFriendDate) {
          venueMap.set(date.venue_id, (venueMap.get(date.venue_id) || 0) + 1);
        }
      }
    }

    // Step 3: Also check positive feedback from friends
    const { data: friendFeedback } = await supabase
      .from('user_venue_feedback')
      .select('venue_id, user_id')
      .in('user_id', friendIds)
      .in('feedback_type', ['like', 'visited', 'love']);

    if (friendFeedback) {
      for (const fb of friendFeedback) {
        venueMap.set(fb.venue_id, (venueMap.get(fb.venue_id) || 0) + 1);
      }
    }
  } catch (e) {
    console.warn('⚠️ FRIEND-PROOF: Failed to fetch friend venue data:', e);
  }

  friendVenueCache = { userId, data: venueMap, ts: now };
  return venueMap;
}

/**
 * Calculate friend social proof bonus for a venue.
 * Max bonus: +6 points
 */
export async function getFriendSocialProofBonus(
  userId: string,
  venueId: string
): Promise<FriendProofResult> {
  const friendMap = await getFriendVenueMap(userId);
  const friendCount = friendMap.get(venueId) || 0;

  if (friendCount === 0) {
    return { bonus: 0, friendCount: 0, reason: null };
  }

  // 1 friend = +2, 2 friends = +4, 3+ friends = +6
  const bonus = Math.min(friendCount * 2, 6);
  const reason = friendCount === 1
    ? '1 Freund war hier'
    : `${friendCount} deiner Freunde waren hier`;

  return { bonus, friendCount, reason };
}
