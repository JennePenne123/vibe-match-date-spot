import { supabase } from '@/integrations/supabase/client';
import { POINT_SOURCES, calculateLevel } from './pointsService';
import { checkAndAwardBadges } from './badgeService';

type PointSourceKey = keyof typeof POINT_SOURCES;

/**
 * Award points to the current user for a specific action.
 * Handles duplicate-safe awarding for one-time actions (profile_complete, preferences_set).
 * Updates level automatically based on new total.
 * After awarding points, automatically checks and awards any new badges.
 */
export const awardPoints = async (
  source: PointSourceKey,
  options?: { skipDuplicateCheck?: boolean }
): Promise<{ success: boolean; newTotal?: number; levelUp?: boolean; newBadges?: string[] }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const pointDef = POINT_SOURCES[source];
    if (!pointDef) {
      console.warn(`Unknown point source: ${source}`);
      return { success: false };
    }

    // Fetch current points
    const { data: currentPoints, error: fetchError } = await supabase
      .from('user_points')
      .select('total_points, level, badges')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching points:', fetchError);
      return { success: false };
    }

    const oldTotal = currentPoints?.total_points ?? 0;
    const oldLevel = currentPoints?.level ?? 1;
    const newTotal = oldTotal + pointDef.points;
    const newLevel = calculateLevel(newTotal);
    const levelUp = newLevel > oldLevel;

    // Upsert points
    const { error: updateError } = await supabase
      .from('user_points')
      .upsert({
        user_id: user.id,
        total_points: newTotal,
        level: newLevel,
        badges: currentPoints?.badges ?? [],
      }, { onConflict: 'user_id' });

    if (updateError) {
      console.error('Error awarding points:', updateError);
      return { success: false };
    }

    console.log(`Awarded ${pointDef.points} points for "${source}". Total: ${newTotal}, Level: ${newLevel}${levelUp ? ' (LEVEL UP!)' : ''}`);

    // Check and award badges asynchronously (non-blocking)
    const newBadges = await checkAndAwardBadges(user.id);

    return { success: true, newTotal, levelUp, newBadges };
  } catch (err) {
    console.error('awardPoints error:', err);
    return { success: false };
  }
};
