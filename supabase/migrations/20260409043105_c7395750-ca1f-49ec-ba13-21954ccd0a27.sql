
-- =============================================
-- FIX 1: Remove duplicate INSERT policy on user_roles
-- =============================================
DROP POLICY IF EXISTS "Only admins can insert roles" ON public.user_roles;

-- =============================================
-- FIX 2: Remove direct INSERT on user_points
-- Points initialization happens via initialize_user_points() trigger (SECURITY DEFINER)
-- Points updates happen via award_user_points() RPC (SECURITY DEFINER)
-- No direct user INSERT should be allowed
-- =============================================
DROP POLICY IF EXISTS "Users can insert their own points" ON public.user_points;
