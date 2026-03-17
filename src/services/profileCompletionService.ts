import { supabase } from '@/integrations/supabase/client';
import { awardPoints } from './awardPointsService';

/**
 * Check if user profile is "complete" and award points if so.
 * Complete = has name, avatar_url, and preferences set.
 */
export const checkAndAwardProfileComplete = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // Check if already awarded by looking at total points context
    const { data: pointsData } = await supabase
      .from('user_points')
      .select('badges')
      .eq('user_id', user.id)
      .maybeSingle();

    // Simple heuristic: if profile_complete was already awarded, skip
    // We track this via a special badge-like marker
    const badges = (pointsData?.badges as string[]) ?? [];
    if (badges.includes('_profile_complete_awarded')) return false;

    // Check profile completeness
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.name || !profile?.avatar_url) return false;

    // Check if preferences exist
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!prefs) return false;

    // Award points
    const result = await awardPoints('profile_complete');

    // Mark as awarded to prevent duplicates
    if (result.success) {
      const updatedBadges = [...badges, '_profile_complete_awarded'];
      await supabase
        .from('user_points')
        .update({ badges: updatedBadges })
        .eq('user_id', user.id);
    }

    return result.success;
  } catch (err) {
    console.error('Profile complete check error:', err);
    return false;
  }
};
