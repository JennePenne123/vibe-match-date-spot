import { supabase } from '@/integrations/supabase/client';

export interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  level: number;
  badges: string[];
  streak_count: number;
  last_review_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  level: number;
  streak_count: number;
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
  { level: 1, points: 0, name: 'Newbie', icon: '🌱' },
  { level: 2, points: 150, name: 'Explorer', icon: '🗺️' },
  { level: 3, points: 500, name: 'Regular', icon: '⭐' },
  { level: 4, points: 1000, name: 'Expert', icon: '💎' },
  { level: 5, points: 2000, name: 'Master', icon: '🏅' },
  { level: 6, points: 3500, name: 'Legend', icon: '👑' },
  { level: 7, points: 5500, name: 'VIP', icon: '🔥' },
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

  // Combine the data
  const profilesMap = new Map(
    (profilesData || []).map(p => [p.id, { name: p.name, avatar_url: p.avatar_url || undefined }])
  );

  return pointsData.map(entry => ({
    user_id: entry.user_id,
    total_points: entry.total_points,
    level: entry.level,
    streak_count: entry.streak_count,
    profile: profilesMap.get(entry.user_id) || { name: 'Unknown User', avatar_url: undefined }
  }));
};

/**
 * Badge definitions with descriptions and requirements
 */
export const BADGE_DEFINITIONS: Record<string, {
  name: string;
  description: string;
  icon: string;
  requirement: string;
}> = {
  'first_reviewer': {
    name: 'First Steps',
    description: 'Completed your first date rating',
    icon: '⭐',
    requirement: 'Rate 1 date'
  },
  'speed_demon': {
    name: 'Speed Demon',
    description: 'Rated within 24 hours of the date',
    icon: '⚡',
    requirement: 'Rate within 24h'
  },
  'consistent_reviewer': {
    name: 'Getting Consistent',
    description: 'Maintained a 3-day rating streak',
    icon: '🔥',
    requirement: '3-day streak'
  },
  'review_master': {
    name: 'Review Master',
    description: 'Maintained a 7-day rating streak',
    icon: '🏆',
    requirement: '7-day streak'
  },
  'date_night_hero': {
    name: 'Date Night Hero',
    description: 'Completed 10 date ratings',
    icon: '💝',
    requirement: '10 ratings'
  },
  'social_butterfly': {
    name: 'Social Butterfly',
    description: 'Completed 25 date ratings',
    icon: '🦋',
    requirement: '25 ratings'
  },
  'legend': {
    name: 'Legend',
    description: 'Completed 50 date ratings',
    icon: '👑',
    requirement: '50 ratings'
  },
  'perfect_pair': {
    name: 'Perfect Pair',
    description: 'Both partners rated together 5 times',
    icon: '💕',
    requirement: 'Both rate 5 times'
  },
  // Referral badges
  'first_referral': {
    name: 'Ambassador',
    description: 'Referred your first friend',
    icon: '🤝',
    requirement: 'Refer 1 friend'
  },
  'social_recruiter': {
    name: 'Social Recruiter',
    description: 'Referred 5 friends',
    icon: '📣',
    requirement: 'Refer 5 friends'
  },
  'community_builder': {
    name: 'Community Builder',
    description: 'Referred 10 friends',
    icon: '🏗️',
    requirement: 'Refer 10 friends'
  },
  'super_connector': {
    name: 'Super Connector',
    description: 'Referred 25 friends',
    icon: '⭐',
    requirement: 'Refer 25 friends'
  }
};

/**
 * Get badge info from badge ID
 */
export const getBadgeInfo = (badgeId: string) => {
  return BADGE_DEFINITIONS[badgeId] || {
    name: badgeId,
    description: 'Achievement unlocked',
    icon: '🏅',
    requirement: 'Special achievement'
  };
};
