
-- Remove ALL friend-scoped policies from base profiles table
-- Friends access profiles ONLY through profiles_safe view (no email, no security_invoker = bypasses RLS)
DROP POLICY IF EXISTS "Friends can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view friend profiles via safe view" ON public.profiles;
DROP POLICY IF EXISTS "Users can view friend profiles" ON public.profiles;
