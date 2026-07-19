ALTER VIEW public.profiles_safe SET (security_invoker = off);
REVOKE ALL ON public.profiles_safe FROM PUBLIC, anon;
GRANT SELECT ON public.profiles_safe TO authenticated;