-- Fix Security Definer View issues by recreating views with SECURITY INVOKER
-- ============================================

-- Recreate profiles_safe view with SECURITY INVOKER
DROP VIEW IF EXISTS public.profiles_safe;
CREATE VIEW public.profiles_safe 
WITH (security_invoker = on)
AS
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

-- Recreate leaderboard_view with SECURITY INVOKER
DROP VIEW IF EXISTS public.leaderboard_view;
CREATE VIEW public.leaderboard_view 
WITH (security_invoker = on)
AS
SELECT 
  user_id,
  total_points,
  level,
  streak_count
FROM public.user_points
WHERE total_points > 0
ORDER BY total_points DESC
LIMIT 100;

-- Grant SELECT on the leaderboard view to authenticated users
GRANT SELECT ON public.leaderboard_view TO authenticated;