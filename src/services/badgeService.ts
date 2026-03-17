import { supabase } from '@/integrations/supabase/client';

/**
 * Badge criteria checkers – each returns true if the badge should be awarded.
 * All queries are scoped to the authenticated user.
 */

type BadgeChecker = (userId: string) => Promise<boolean>;

const checkers: Record<string, BadgeChecker> = {
  // ── Rating badges ──
  first_reviewer: async (userId) => {
    const { count } = await supabase
      .from('date_feedback')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    return (count ?? 0) >= 1;
  },

  speed_demon: async (userId) => {
    // Check if any feedback was given within 24h of the date
    const { data } = await supabase
      .from('date_feedback')
      .select('created_at, invitation_id')
      .eq('user_id', userId)
      .limit(50);
    if (!data || data.length === 0) return false;

    for (const fb of data) {
      const { data: inv } = await supabase
        .from('date_invitations')
        .select('actual_date_time')
        .eq('id', fb.invitation_id)
        .maybeSingle();
      if (inv?.actual_date_time) {
        const diff = new Date(fb.created_at).getTime() - new Date(inv.actual_date_time).getTime();
        if (diff >= 0 && diff < 24 * 60 * 60 * 1000) return true;
      }
    }
    return false;
  },

  consistent_reviewer: async (_userId) => {
    const { data: points } = await supabase
      .from('user_points')
      .select('streak_count')
      .eq('user_id', _userId)
      .maybeSingle();
    return (points?.streak_count ?? 0) >= 3;
  },

  review_master: async (_userId) => {
    const { data: points } = await supabase
      .from('user_points')
      .select('streak_count')
      .eq('user_id', _userId)
      .maybeSingle();
    return (points?.streak_count ?? 0) >= 7;
  },

  date_night_hero: async (userId) => {
    const { count } = await supabase
      .from('date_feedback')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    return (count ?? 0) >= 10;
  },

  social_butterfly: async (userId) => {
    const { count } = await supabase
      .from('date_feedback')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    return (count ?? 0) >= 25;
  },

  legend: async (userId) => {
    const { count } = await supabase
      .from('date_feedback')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    return (count ?? 0) >= 50;
  },

  perfect_pair: async (userId) => {
    const { data } = await supabase.rpc('count_perfect_pairs', { target_user_id: userId });
    return (data ?? 0) >= 5;
  },

  // ── Exploration badges ──
  explorer: async (userId) => {
    const { data } = await supabase
      .from('date_feedback')
      .select('invitation_id')
      .eq('user_id', userId);
    if (!data || data.length < 5) return false;

    const invIds = data.map(d => d.invitation_id);
    const { data: invitations } = await supabase
      .from('date_invitations')
      .select('venue_id')
      .in('id', invIds)
      .not('venue_id', 'is', null);

    const uniqueVenues = new Set(invitations?.map(i => i.venue_id));
    return uniqueVenues.size >= 5;
  },

  foodie: async (userId) => {
    const { data } = await supabase
      .from('date_feedback')
      .select('invitation_id')
      .eq('user_id', userId);
    if (!data || data.length < 3) return false;

    const invIds = data.map(d => d.invitation_id);
    const { data: invitations } = await supabase
      .from('date_invitations')
      .select('venue_id')
      .in('id', invIds)
      .not('venue_id', 'is', null);

    const venueIds = [...new Set(invitations?.map(i => i.venue_id).filter(Boolean))];
    if (venueIds.length < 3) return false;

    const { data: venues } = await supabase
      .from('venues')
      .select('cuisine_type')
      .in('id', venueIds)
      .not('cuisine_type', 'is', null);

    const uniqueCuisines = new Set(venues?.map(v => v.cuisine_type));
    return uniqueCuisines.size >= 3;
  },

  // ── Engagement badges ──
  planner: async (userId) => {
    const { count } = await supabase
      .from('date_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', userId);
    return (count ?? 0) >= 10;
  },

  deal_hunter: async (userId) => {
    const { count } = await supabase
      .from('voucher_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    return (count ?? 0) >= 5;
  },

  committed: async (userId) => {
    const { data: points } = await supabase
      .from('user_points')
      .select('streak_count')
      .eq('user_id', userId)
      .maybeSingle();
    return (points?.streak_count ?? 0) >= 30;
  },

  chatterbox: async (userId) => {
    const { count } = await supabase
      .from('invitation_messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', userId);
    return (count ?? 0) >= 50;
  },

  // ── Referral badges ──
  first_referral: async (userId) => {
    const { data: points } = await supabase
      .from('user_points')
      .select('referral_count')
      .eq('user_id', userId)
      .maybeSingle();
    return (points?.referral_count ?? 0) >= 1;
  },

  social_recruiter: async (userId) => {
    const { data: points } = await supabase
      .from('user_points')
      .select('referral_count')
      .eq('user_id', userId)
      .maybeSingle();
    return (points?.referral_count ?? 0) >= 5;
  },

  community_builder: async (userId) => {
    const { data: points } = await supabase
      .from('user_points')
      .select('referral_count')
      .eq('user_id', userId)
      .maybeSingle();
    return (points?.referral_count ?? 0) >= 10;
  },

  super_connector: async (userId) => {
    const { data: points } = await supabase
      .from('user_points')
      .select('referral_count')
      .eq('user_id', userId)
      .maybeSingle();
    return (points?.referral_count ?? 0) >= 25;
  },
};

/**
 * Check all badge criteria for a user and award any newly earned badges.
 * Returns the list of newly awarded badge IDs.
 */
export const checkAndAwardBadges = async (userId: string): Promise<string[]> => {
  try {
    // Get current badges
    const { data: pointsData, error } = await supabase
      .from('user_points')
      .select('badges')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !pointsData) return [];

    const currentBadges = (pointsData.badges as string[]) ?? [];
    const earnedSet = new Set(currentBadges);
    const newBadges: string[] = [];

    // Only check badges not yet earned
    const unchecked = Object.keys(checkers).filter(id => !earnedSet.has(id));

    // Check in parallel batches of 5 to avoid overwhelming the DB
    for (let i = 0; i < unchecked.length; i += 5) {
      const batch = unchecked.slice(i, i + 5);
      const results = await Promise.all(
        batch.map(async (badgeId) => {
          try {
            const earned = await checkers[badgeId](userId);
            return { badgeId, earned };
          } catch (err) {
            console.warn(`Badge check failed for ${badgeId}:`, err);
            return { badgeId, earned: false };
          }
        })
      );
      results.filter(r => r.earned).forEach(r => newBadges.push(r.badgeId));
    }

    // Persist newly earned badges
    if (newBadges.length > 0) {
      const updatedBadges = [...currentBadges, ...newBadges];
      await supabase
        .from('user_points')
        .update({ badges: updatedBadges })
        .eq('user_id', userId);

      console.log(`🏅 Awarded ${newBadges.length} new badge(s):`, newBadges);
    }

    return newBadges;
  } catch (err) {
    console.error('Badge check error:', err);
    return [];
  }
};
