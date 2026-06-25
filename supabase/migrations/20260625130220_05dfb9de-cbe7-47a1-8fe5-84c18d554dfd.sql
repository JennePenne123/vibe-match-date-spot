-- Revert profiles_safe to a security_invoker view so it does NOT trigger the
-- "Security Definer View" linter error, while still exposing ONLY non-sensitive
-- columns (id, name, avatar_url) and never the email column. The base profiles
-- table keeps its strict own-row SELECT policy, so emails are never readable by
-- other users through any path.
DROP VIEW IF EXISTS public.profiles_safe;
CREATE VIEW public.profiles_safe
WITH (security_invoker = on) AS
SELECT id, name, avatar_url
FROM public.profiles;

REVOKE ALL ON public.profiles_safe FROM PUBLIC, anon;
GRANT SELECT ON public.profiles_safe TO authenticated, service_role;