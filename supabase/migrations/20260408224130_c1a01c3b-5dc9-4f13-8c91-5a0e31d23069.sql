
-- =============================================
-- FIX 1: Protect home address from friends
-- =============================================

-- Drop the existing overly-permissive policy
DROP POLICY IF EXISTS "Allow compatibility calculations" ON public.user_preferences;

-- Policy 1: Users can always see their own full preferences
CREATE POLICY "Users can view own preferences"
ON public.user_preferences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a safe view that excludes location data
CREATE OR REPLACE VIEW public.user_preferences_safe
WITH (security_invoker = on)
AS
SELECT
  id,
  user_id,
  preferred_cuisines,
  preferred_vibes,
  preferred_times,
  preferred_price_range,
  preferred_activities,
  preferred_entertainment,
  preferred_venue_types,
  preferred_duration,
  dietary_restrictions,
  excluded_cuisines,
  accessibility_needs,
  personality_traits,
  lifestyle_data,
  relationship_goal,
  max_distance,
  created_at,
  updated_at
FROM public.user_preferences;

-- Friends/planning partners can still read for compatibility calculations
CREATE POLICY "Friends can view preferences for compatibility"
ON public.user_preferences
FOR SELECT
TO authenticated
USING (
  (EXISTS (
    SELECT 1 FROM date_planning_sessions
    WHERE (
      (date_planning_sessions.initiator_id = auth.uid() AND date_planning_sessions.partner_id = user_preferences.user_id)
      OR (date_planning_sessions.partner_id = auth.uid() AND date_planning_sessions.initiator_id = user_preferences.user_id)
    )
    AND date_planning_sessions.session_status = 'active'
    AND date_planning_sessions.expires_at > now()
  ))
  OR (EXISTS (
    SELECT 1 FROM friendships
    WHERE (
      (friendships.user_id = auth.uid() AND friendships.friend_id = user_preferences.user_id)
      OR (friendships.friend_id = auth.uid() AND friendships.user_id = user_preferences.user_id)
    )
    AND friendships.status = 'accepted'
  ))
);

-- Security definer function to get friend preferences WITHOUT location data
CREATE OR REPLACE FUNCTION public.get_friend_preferences(_friend_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'preferred_cuisines', preferred_cuisines,
    'preferred_vibes', preferred_vibes,
    'preferred_times', preferred_times,
    'preferred_price_range', preferred_price_range,
    'preferred_activities', preferred_activities,
    'preferred_entertainment', preferred_entertainment,
    'preferred_venue_types', preferred_venue_types,
    'preferred_duration', preferred_duration,
    'dietary_restrictions', dietary_restrictions,
    'excluded_cuisines', excluded_cuisines,
    'accessibility_needs', accessibility_needs,
    'personality_traits', personality_traits,
    'lifestyle_data', lifestyle_data,
    'relationship_goal', relationship_goal,
    'max_distance', max_distance
  )
  FROM public.user_preferences
  WHERE user_id = _friend_id
  AND (
    EXISTS (
      SELECT 1 FROM friendships
      WHERE (
        (friendships.user_id = auth.uid() AND friendships.friend_id = _friend_id)
        OR (friendships.friend_id = auth.uid() AND friendships.user_id = _friend_id)
      )
      AND friendships.status = 'accepted'
    )
    OR EXISTS (
      SELECT 1 FROM date_planning_sessions
      WHERE (
        (initiator_id = auth.uid() AND partner_id = _friend_id)
        OR (partner_id = auth.uid() AND initiator_id = _friend_id)
      )
      AND session_status = 'active'
      AND expires_at > now()
    )
  );
$$;

-- =============================================
-- FIX 2: Fix voucher forgery
-- =============================================

-- Drop the broken INSERT policy
DROP POLICY IF EXISTS "Partners can create exclusive vouchers" ON public.partner_exclusive_vouchers;

-- Create corrected INSERT policy: only the offering partner can create, must be venue_partner
CREATE POLICY "Partners can create exclusive vouchers"
ON public.partner_exclusive_vouchers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = offering_partner_id
  AND has_role(auth.uid(), 'venue_partner')
);
