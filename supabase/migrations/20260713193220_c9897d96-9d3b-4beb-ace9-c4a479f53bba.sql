CREATE OR REPLACE VIEW public.profiles_safe
WITH (security_invoker = off) AS
SELECT id, name, avatar_url
FROM public.profiles;

GRANT SELECT ON public.profiles_safe TO authenticated;