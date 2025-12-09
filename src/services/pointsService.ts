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
 * Calculate level from total points
 * Level progression: Level = floor(sqrt(points / 100)) + 1
 */
export const calculateLevel = (totalPoints: number): number => {
  return Math.floor(Math.sqrt(totalPoints / 100)) + 1;
};

/**
 * Calculate points needed for next level
 */
export const getPointsForNextLevel = (currentLevel: number): number => {
  return (currentLevel * currentLevel) * 100;
};

/**
 * Get progress percentage to next level
 */
export const getLevelProgress = (totalPoints: number, currentLevel: number): number => {
  const currentLevelPoints = ((currentLevel - 1) * (currentLevel - 1)) * 100;
  const nextLevelPoints = getPointsForNextLevel(currentLevel);
  const progressPoints = totalPoints - currentLevelPoints;
  const pointsNeeded = nextLevelPoints - currentLevelPoints;
  
  return Math.min(100, Math.max(0, (progressPoints / pointsNeeded) * 100));
};

/**
 * Fetch leaderboard data
 */
export const getLeaderboard = async (limit: number = 10): Promise<LeaderboardEntry[]> => {
  // First, get the top user_points entries
  const { data: pointsData, error: pointsError } = await supabase
    .from('user_points')
    .select('user_id, total_points, level, streak_count')
    .order('total_points', { ascending: false })
    .limit(limit);

  if (pointsError) {
    console.error('Error fetching leaderboard:', pointsError);
    return [];
  }

  if (!pointsData || pointsData.length === 0) {
    return [];
  }

  // Then, fetch profiles for these users
  const userIds = pointsData.map(p => p.user_id);
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', userIds);

  if (profilesError) {
    console.error('Error fetching profiles for leaderboard:', profilesError);
  }

  // Combine the data
  const profilesMap = new Map(
    (profilesData || []).map(p => [p.id, { name: p.name, avatar_url: p.avatar_url }])
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
