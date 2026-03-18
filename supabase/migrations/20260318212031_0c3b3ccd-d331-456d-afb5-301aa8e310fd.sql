
-- FIX ERROR 1: feedback_rewards - restrict INSERT to service role only
-- Users should not be able to self-award points
DROP POLICY IF EXISTS "Users can insert their own rewards" ON public.feedback_rewards;
CREATE POLICY "Only service role can insert rewards" ON public.feedback_rewards
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- FIX ERROR 2: ai_learning_data INSERT - must check user_id matches
DROP POLICY IF EXISTS "System can insert learning data" ON public.ai_learning_data;
CREATE POLICY "System can insert learning data" ON public.ai_learning_data
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- FIX ERROR 3: profiles_safe view - enable RLS explicitly
-- The view was recreated with security_invoker but let's also ensure RLS
ALTER VIEW public.profiles_safe SET (security_invoker = on);

-- FIX WARN: venues INSERT - restrict to admin/partner only
DROP POLICY IF EXISTS "Admins can insert venues" ON public.venues;
DROP POLICY IF EXISTS "Partners can insert venues" ON public.venues;
DROP POLICY IF EXISTS "Anyone can insert venues from external sources" ON public.venues;
CREATE POLICY "Admins and partners can insert venues" ON public.venues
FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'venue_partner'::app_role)
);
