-- STEP 1: Fix profiles_safe view - Revoke all, grant only to authenticated
REVOKE ALL ON public.profiles_safe FROM anon, public;
GRANT SELECT ON public.profiles_safe TO authenticated;

-- STEP 2: Fix leaderboard_view - Revoke all, grant only to authenticated  
REVOKE ALL ON public.leaderboard_view FROM anon, public;
GRANT SELECT ON public.leaderboard_view TO authenticated;

-- STEP 3: Add explicit deny policy for anonymous users on profiles table
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- STEP 4: Make the push_subscriptions deny policy comprehensive
DROP POLICY IF EXISTS "Deny anonymous access to push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Deny anonymous select on push subscriptions"
ON public.push_subscriptions FOR SELECT TO anon USING (false);

CREATE POLICY "Deny anonymous insert on push subscriptions"
ON public.push_subscriptions FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "Deny anonymous update on push subscriptions"
ON public.push_subscriptions FOR UPDATE TO anon USING (false) WITH CHECK (false);

CREATE POLICY "Deny anonymous delete on push subscriptions"
ON public.push_subscriptions FOR DELETE TO anon USING (false);