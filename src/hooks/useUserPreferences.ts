import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { STALE_TIMES } from '@/config/queryConfig';

export interface UserPreferencesData {
  preferred_cuisines: string[] | null;
  preferred_vibes: string[] | null;
  preferred_price_range: string[] | null;
  preferred_times: string[] | null;
  dietary_restrictions: string[] | null;
  personality_traits: Record<string, unknown> | null;
  relationship_goal: string | null;
  max_distance: number | null;
  home_latitude: number | null;
  home_longitude: number | null;
  home_address: string | null;
  preferred_activities: string[] | null;
  preferred_entertainment: string[] | null;
  preferred_duration: string | null;
  accessibility_needs: string[] | null;
  preferred_venue_types: string[] | null;
  excluded_cuisines: string[] | null;
  lifestyle_data: Record<string, unknown> | null;
}

/**
 * Shared React Query hook for user_preferences.
 * All Home-page components share one cached query instead of 3+ duplicate fetches.
 */
export function useUserPreferences() {
  const { user } = useAuth();

  return useQuery<UserPreferencesData | null>({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserPreferencesData | null;
    },
    enabled: !!user,
    staleTime: STALE_TIMES.DYNAMIC,
  });
}
