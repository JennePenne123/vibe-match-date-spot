-- Monthly API spend is only needed by backend functions (budget guard); nobody else may read it.
REVOKE ALL ON FUNCTION public.get_api_monthly_spend(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_api_monthly_spend(text) TO service_role;

-- Admin-only metrics: signed-out visitors never need to call it (admin check inside stays).
REVOKE ALL ON FUNCTION public.get_photo_backfill_metrics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_photo_backfill_metrics(integer) TO authenticated, service_role;