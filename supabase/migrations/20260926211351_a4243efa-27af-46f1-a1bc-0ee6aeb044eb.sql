REVOKE EXECUTE ON FUNCTION public.get_api_monthly_spend(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_api_monthly_spend(text) TO service_role;