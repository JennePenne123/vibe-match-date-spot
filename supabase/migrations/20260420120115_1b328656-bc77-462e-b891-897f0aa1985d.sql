-- Fix 1: Restrict profiles SELECT to own row only (use profiles_safe view for cross-user lookups)
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.profiles;

-- The existing "Users can view their own profile" policy (auth.uid() = id) remains and is sufficient.

-- Fix 3: Add explicit admin INSERT/UPDATE policies on user_points for transparency.
-- All user-facing point modifications go through SECURITY DEFINER functions (award_user_points, update_user_streak)
-- which bypass RLS. These policies make admin write paths explicit.
CREATE POLICY "Admins can insert user points"
ON public.user_points
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user points"
ON public.user_points
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));