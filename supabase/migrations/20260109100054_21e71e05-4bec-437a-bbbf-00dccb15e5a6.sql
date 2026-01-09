-- ============================================
-- Security Fix Migration: 4 Error-Level Issues
-- ============================================

-- Issue 1: Profiles table - Create safe view that hides email from friends
-- ============================================
CREATE OR REPLACE VIEW public.profiles_safe AS
SELECT 
  id,
  name,
  avatar_url,
  created_at,
  updated_at,
  CASE 
    WHEN id = auth.uid() THEN email
    ELSE NULL
  END as email
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.profiles_safe TO authenticated;

-- Issue 2: Push subscriptions - Add explicit deny for anonymous users
-- ============================================
CREATE POLICY "Deny anonymous access to push subscriptions"
ON public.push_subscriptions
FOR ALL
TO anon
USING (false);

-- Issue 3: User points - Fix leaderboard exposure
-- ============================================
-- Drop the overly permissive leaderboard policy
DROP POLICY IF EXISTS "Authenticated users can view leaderboard" ON public.user_points;

-- Create a secure leaderboard view with only necessary public data
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT 
  user_id,
  total_points,
  level,
  streak_count
  -- Excluded: referral_code, last_review_date, referral_count, referral_points_earned, badges
FROM public.user_points
WHERE total_points > 0
ORDER BY total_points DESC
LIMIT 100;

-- Grant SELECT on the leaderboard view to authenticated users
GRANT SELECT ON public.leaderboard_view TO authenticated;

-- Issue 4: Venues - Add source tracking and restrict creation
-- ============================================
-- Add columns to track venue source
ALTER TABLE public.venues 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'user',
ADD COLUMN IF NOT EXISTS verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Drop the permissive venue creation policy
DROP POLICY IF EXISTS "Authenticated users can create venues" ON public.venues;

-- Create restrictive policy: Only allow trusted sources
CREATE POLICY "System can create venues from trusted sources"
ON public.venues
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    -- Allow admins to create any venue
    public.has_role(auth.uid(), 'admin')
    OR
    -- Allow venue partners to create venues
    public.has_role(auth.uid(), 'venue_partner')
    OR
    -- Allow venues from trusted external sources (foursquare, google)
    (source IN ('foursquare', 'google_places', 'system'))
  )
);