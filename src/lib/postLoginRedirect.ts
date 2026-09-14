import { supabase } from '@/integrations/supabase/client';
import { hasCompletedPreferenceSetup } from '@/utils/preferenceCompletion';
import { hasMoodToday } from '@/utils/moodStorage';
import { readGroupToken, buildGroupJoinLink } from '@/lib/groupInviteLink';

/**
 * Central post-login routing. Every sign-in path (email/password, OAuth
 * callback, passkey, "already logged in") must resolve its target through
 * this function so all entry points behave identically.
 *
 * Priority:
 * 1. Pending group-invite deep link  → /join-group?token=…
 * 2. Staff/admin roles               → /partner
 * 3. Onboarding incomplete           → /welcome
 * 4. Regular user                    → /home (or /mood when no mood today)
 */
export const resolvePostLoginPath = async (userId: string): Promise<string> => {
  // 1. A pending group invite always wins.
  const groupToken = readGroupToken();
  if (groupToken) {
    const url = new URL(buildGroupJoinLink(groupToken));
    return `${url.pathname}${url.search}`;
  }

  // 2. Role-based routing (priority: admin > venue_partner > regular).
  try {
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const roles = (rolesData ?? []).map((r) => r.role as string);
    if (roles.includes('admin') || roles.includes('venue_partner')) {
      return '/partner';
    }
  } catch {
    // Role lookup failing must never block login — continue as regular user.
  }

  // 3. Send users with an empty preference setup through onboarding.
  try {
    const { data } = await supabase
      .from('user_preferences')
      .select(
        'preferred_cuisines, preferred_vibes, preferred_times, preferred_price_range, ' +
        'preferred_activities, preferred_entertainment, preferred_venue_types, ' +
        'preferred_duration, dietary_restrictions, accessibility_needs, ' +
        'home_address, home_latitude, home_longitude, personality_traits, relationship_goal'
      )
      .eq('user_id', userId)
      .maybeSingle();

    if (!hasCompletedPreferenceSetup(data as never)) {
      return '/welcome';
    }
  } catch {
    // Preference lookup failing must never block login — fall through to home.
    return '/home';
  }

  // 4. Regular signed-in user.
  return hasMoodToday() ? '/home' : '/mood';
};
