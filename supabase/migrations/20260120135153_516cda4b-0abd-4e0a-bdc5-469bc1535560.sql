-- Secure venues - drop overly permissive policy and add authenticated-only
DROP POLICY IF EXISTS "Anyone can view active venues" ON public.venues;

CREATE POLICY "Authenticated users can view active venues"
ON public.venues
FOR SELECT
TO authenticated
USING (is_active = true);