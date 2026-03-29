import { supabase } from '@/integrations/supabase/client';

export interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  level: number;
  badges: string[];
  streak_count: number;
  last_review_date: string | null;
  premium_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  level: number;
  streak_count: number;
  premium_until: string | null;
  profile: {
    name: string;
    avatar_url?: string;
  };
}

/**
 * Fetch user points data for the current user
 */
export const getUserPoints = async (): Promise<UserPoints | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user');
    return null;
  }

  const { data, error } = await supabase
    .from('user_points')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user points:', error);
    return null;
  }

  return data;
};

/**
 * Initialize user points if they don't exist
 */
export const initializeUserPoints = async (): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { error } = await supabase
    .from('user_points')
    .insert({
      user_id: user.id,
      total_points: 0,
      level: 1,
      badges: [],
      streak_count: 0,
    });

  if (error) {
    // Already exists or other error
    console.log('Points initialization:', error.message);
    return false;
  }

  return true;
};

/**
 * Level thresholds – fixed values for full control & transparency
 */
export const LEVEL_THRESHOLDS = [
  { level: 1, points: 0, name: 'Newbie', lucideIcon: 'sprout' as const, color: 'text-green-500', bg: 'bg-green-500/15' },
  { level: 2, points: 500, name: 'Explorer', lucideIcon: 'compass' as const, color: 'text-blue-500', bg: 'bg-blue-500/15' },
  { level: 3, points: 2000, name: 'Regular', lucideIcon: 'star' as const, color: 'text-yellow-500', bg: 'bg-yellow-500/15' },
  { level: 4, points: 5000, name: 'Expert', lucideIcon: 'gem' as const, color: 'text-purple-500', bg: 'bg-purple-500/15' },
  { level: 5, points: 10000, name: 'Master', lucideIcon: 'medal' as const, color: 'text-amber-500', bg: 'bg-amber-500/15' },
  { level: 6, points: 18000, name: 'Legend', lucideIcon: 'crown' as const, color: 'text-orange-500', bg: 'bg-orange-500/15' },
  { level: 7, points: 30000, name: 'VIP', lucideIcon: 'flame' as const, color: 'text-red-500', bg: 'bg-red-500/15' },
] as const;

/**
 * Calculate level from total points using fixed thresholds
 */
export const calculateLevel = (totalPoints: number): number => {
  let level = 1;
  for (const threshold of LEVEL_THRESHOLDS) {
    if (totalPoints >= threshold.points) {
      level = threshold.level;
    } else {
      break;
    }
  }
  return level;
};

/**
 * Get level info (name, icon) for a given level
 */
export const getLevelInfo = (level: number) => {
  const info = LEVEL_THRESHOLDS.find(t => t.level === level);
  return info || LEVEL_THRESHOLDS[0];
};

/**
 * Calculate points needed for next level
 */
export const getPointsForNextLevel = (currentLevel: number): number => {
  const next = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);
  if (!next) return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].points; // max level
  return next.points;
};

/**
 * Get progress percentage to next level
 */
export const getLevelProgress = (totalPoints: number, currentLevel: number): number => {
  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel);
  const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);

  if (!nextThreshold) return 100; // max level reached

  const currentLevelPoints = currentThreshold?.points ?? 0;
  const nextLevelPoints = nextThreshold.points;
  const progressPoints = totalPoints - currentLevelPoints;
  const pointsNeeded = nextLevelPoints - currentLevelPoints;

  return Math.min(100, Math.max(0, (progressPoints / pointsNeeded) * 100));
};

/**
 * Point sources with their values
 */
export const POINT_SOURCES = {
  // Date ratings (existing)
  rating_base: { points: 10, label: 'Date bewertet' },
  rating_venue: { points: 5, label: 'Venue bewertet' },
  rating_recommend: { points: 5, label: 'Empfehlung abgegeben' },
  rating_text: { points: 10, label: 'Kommentar geschrieben' },
  rating_speed_bonus: { points: 10, label: 'Speed-Bonus (< 24h)' },
  // Profile & setup
  profile_complete: { points: 20, label: 'Profil vervollständigt' },
  preferences_set: { points: 15, label: 'Präferenzen gesetzt' },
  // Dating actions
  date_planned: { points: 10, label: 'Date geplant' },
  date_accepted: { points: 5, label: 'Date angenommen' },
  // Daily engagement
  mood_checkin: { points: 5, label: 'Mood Check-In' },
  weekly_streak_bonus: { points: 25, label: '7-Tage Streak Bonus' },
  // Vouchers
  voucher_redeemed: { points: 15, label: 'Voucher eingelöst' },
  // Referrals (existing)
  referral_signup: { points: 25, label: 'Freund eingeladen (Signup)' },
  referral_completed: { points: 50, label: 'Freund eingeladen (erstes Date)' },
  referee_signup: { points: 10, label: 'Einladung angenommen' },
  referee_completed: { points: 25, label: 'Erstes Date abgeschlossen' },
} as const;

/**
 * Fetch leaderboard data using secure leaderboard_view
 */
export const getLeaderboard = async (limit: number = 10): Promise<LeaderboardEntry[]> => {
  // Use secure leaderboard_view that only exposes necessary public data
  // Cast to 'any' since leaderboard_view is not in generated types yet
  const { data: pointsData, error: pointsError } = await (supabase
    .from('leaderboard_view' as any)
    .select('user_id, total_points, level, streak_count')
    .limit(limit)) as { data: Array<{ user_id: string; total_points: number; level: number; streak_count: number }> | null; error: any };

  if (pointsError) {
    console.error('Error fetching leaderboard:', pointsError);
    return [];
  }

  if (!pointsData || pointsData.length === 0) {
    return [];
  }

  // Fetch profiles using profiles_safe view (excludes email for non-owners)
  const userIds = pointsData.map(p => p.user_id);
  const { data: profilesData, error: profilesError } = await (supabase
    .from('profiles_safe' as any)
    .select('id, name, avatar_url')
    .in('id', userIds)) as { data: Array<{ id: string; name: string; avatar_url: string | null }> | null; error: any };

  if (profilesError) {
    console.error('Error fetching profiles for leaderboard:', profilesError);
  }

  // Fetch premium status for leaderboard users
  const { data: premiumData } = await supabase
    .from('user_points')
    .select('user_id, premium_until')
    .in('user_id', userIds);

  const premiumMap = new Map(
    (premiumData || []).map(p => [p.user_id, (p as any).premium_until as string | null])
  );

  // Combine the data
  const profilesMap = new Map(
    (profilesData || []).map(p => [p.id, { name: p.name, avatar_url: p.avatar_url || undefined }])
  );

  return pointsData.map(entry => ({
    user_id: entry.user_id,
    total_points: entry.total_points,
    level: entry.level,
    streak_count: entry.streak_count,
    premium_until: premiumMap.get(entry.user_id) || null,
    profile: profilesMap.get(entry.user_id) || { name: 'Unknown User', avatar_url: undefined }
  }));
};

/**
 * Badge definitions with descriptions and requirements
 */
export const BADGE_DEFINITIONS: Record<string, {
  name: string;
  description: string;
  lucideIcon: string;
  color: string;
  bg: string;
  requirement: string;
  category: 'rating' | 'social' | 'engagement' | 'exploration' | 'referral';
}> = {
  // Rating badges
  'first_reviewer': {
    name: 'First Steps',
    description: 'Deine erste Date-Bewertung abgegeben',
    lucideIcon: 'star',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/15',
    requirement: '1 Date bewerten',
    category: 'rating',
  },
  'speed_demon': {
    name: 'Speed Demon',
    description: 'Innerhalb von 24 Stunden bewertet',
    lucideIcon: 'zap',
    color: 'text-amber-500',
    bg: 'bg-amber-500/15',
    requirement: 'Bewertung < 24h',
    category: 'rating',
  },
  'consistent_reviewer': {
    name: 'Getting Consistent',
    description: '3-Tage Bewertungs-Streak erreicht',
    lucideIcon: 'flame',
    color: 'text-orange-500',
    bg: 'bg-orange-500/15',
    requirement: '3-Tage Streak',
    category: 'rating',
  },
  'review_master': {
    name: 'Review Master',
    description: '7-Tage Bewertungs-Streak erreicht',
    lucideIcon: 'trophy',
    color: 'text-yellow-600',
    bg: 'bg-yellow-600/15',
    requirement: '7-Tage Streak',
    category: 'rating',
  },
  'date_night_hero': {
    name: 'Date Night Hero',
    description: '10 Date-Bewertungen abgegeben',
    lucideIcon: 'heart',
    color: 'text-pink-500',
    bg: 'bg-pink-500/15',
    requirement: '10 Bewertungen',
    category: 'rating',
  },
  'social_butterfly': {
    name: 'Social Butterfly',
    description: '25 Date-Bewertungen abgegeben',
    lucideIcon: 'sparkles',
    color: 'text-violet-500',
    bg: 'bg-violet-500/15',
    requirement: '25 Bewertungen',
    category: 'rating',
  },
  'legend': {
    name: 'Legende',
    description: '50 Date-Bewertungen abgegeben',
    lucideIcon: 'crown',
    color: 'text-amber-600',
    bg: 'bg-amber-600/15',
    requirement: '50 Bewertungen',
    category: 'rating',
  },
  'perfect_pair': {
    name: 'Perfect Pair',
    description: 'Beide Partner haben 5× zusammen bewertet',
    lucideIcon: 'heart-handshake',
    color: 'text-rose-500',
    bg: 'bg-rose-500/15',
    requirement: '5× gemeinsam bewertet',
    category: 'rating',
  },
  // Exploration badges
  'explorer': {
    name: 'Explorer',
    description: '5 verschiedene Venues besucht',
    lucideIcon: 'map-pin',
    color: 'text-blue-500',
    bg: 'bg-blue-500/15',
    requirement: '5 Venues besucht',
    category: 'exploration',
  },
  'foodie': {
    name: 'Foodie',
    description: '3 verschiedene Küchen ausprobiert',
    lucideIcon: 'utensils',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/15',
    requirement: '3 Küchen-Typen',
    category: 'exploration',
  },
  // Engagement badges
  'planner': {
    name: 'Planner',
    description: '10 Dates geplant',
    lucideIcon: 'calendar-check',
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/15',
    requirement: '10 Dates geplant',
    category: 'engagement',
  },
  'deal_hunter': {
    name: 'Deal Hunter',
    description: '5 Vouchers eingelöst',
    lucideIcon: 'ticket',
    color: 'text-teal-500',
    bg: 'bg-teal-500/15',
    requirement: '5 Vouchers eingelöst',
    category: 'engagement',
  },
  'committed': {
    name: 'Committed',
    description: '30-Tage Login-Streak erreicht',
    lucideIcon: 'calendar-days',
    color: 'text-sky-500',
    bg: 'bg-sky-500/15',
    requirement: '30-Tage Streak',
    category: 'engagement',
  },
  'chatterbox': {
    name: 'Chatterbox',
    description: '50 Chat-Nachrichten gesendet',
    lucideIcon: 'message-circle',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/15',
    requirement: '50 Nachrichten',
    category: 'social',
  },
  // Referral badges
  'first_referral': {
    name: 'Ambassador',
    description: 'Ersten Freund eingeladen',
    lucideIcon: 'handshake',
    color: 'text-green-500',
    bg: 'bg-green-500/15',
    requirement: '1 Freund einladen',
    category: 'referral',
  },
  'social_recruiter': {
    name: 'Social Recruiter',
    description: '5 Freunde eingeladen',
    lucideIcon: 'megaphone',
    color: 'text-fuchsia-500',
    bg: 'bg-fuchsia-500/15',
    requirement: '5 Freunde einladen',
    category: 'referral',
  },
  'community_builder': {
    name: 'Community Builder',
    description: '10 Freunde eingeladen',
    lucideIcon: 'building',
    color: 'text-slate-600',
    bg: 'bg-slate-600/15',
    requirement: '10 Freunde einladen',
    category: 'referral',
  },
  'super_connector': {
    name: 'Super Connector',
    description: '25 Freunde eingeladen',
    lucideIcon: 'sparkle',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/15',
    requirement: '25 Freunde einladen',
    category: 'referral',
  },
};

/**
 * Get badge info from badge ID
 */
export const getBadgeInfo = (badgeId: string) => {
  return BADGE_DEFINITIONS[badgeId] || {
    name: badgeId,
    description: 'Achievement unlocked',
    lucideIcon: 'award',
    color: 'text-primary',
    bg: 'bg-primary/15',
    requirement: 'Special achievement',
    category: 'engagement' as const,
  };
};
