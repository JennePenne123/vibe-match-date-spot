import { supabase } from '@/integrations/supabase/client';
import { POINT_SOURCES, calculateLevel } from './pointsService';
import { checkAndAwardBadges } from './badgeService';

type PointSourceKey = keyof typeof POINT_SOURCES;

/**
 * Award XP and Coins to the current user for a specific action.
 * XP = experience for levels (never spent)
 * Coins (total_points) = shop currency (can be spent)
 */
export const awardPoints = async (
  source: PointSourceKey,
  options?: { skipDuplicateCheck?: boolean }
): Promise<{ success: boolean; newTotal?: number; newXp?: number; levelUp?: boolean; newBadges?: string[] }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const pointDef = POINT_SOURCES[source];
    if (!pointDef) {
      console.warn(`Unknown point source: ${source}`);
      return { success: false };
    }

    const coins = pointDef.points;
    const xp = pointDef.xp;

    // Fetch current points
    const { data: currentPoints, error: fetchError } = await supabase
      .from('user_points')
      .select('total_points, lifetime_xp, level, badges')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching points:', fetchError);
      return { success: false };
    }

    const oldXp = (currentPoints as any)?.lifetime_xp ?? currentPoints?.total_points ?? 0;
    const oldLevel = currentPoints?.level ?? 1;
    const newXp = oldXp + xp;
    const newLevel = calculateLevel(newXp);
    const levelUp = newLevel > oldLevel;
    const newTotal = (currentPoints?.total_points ?? 0) + coins;

    // Use the secure DB function to award points
    const { error: rpcError } = await supabase.rpc('award_user_points', {
      target_user_id: user.id,
      points_to_add: coins,
      xp_to_add: xp,
    });

    if (rpcError) {
      console.error('Error awarding points:', rpcError);
      return { success: false };
    }

    console.log(`Awarded ${coins} coins + ${xp} XP for "${source}". Coins: ${newTotal}, XP: ${newXp}, Level: ${newLevel}${levelUp ? ' (LEVEL UP!)' : ''}`);

    // Check and award badges asynchronously
    const newBadges = await checkAndAwardBadges(user.id);

    return { success: true, newTotal, newXp, levelUp, newBadges };
  } catch (err) {
    console.error('awardPoints error:', err);
    return { success: false };
  }
};
