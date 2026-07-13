
-- Revoke direct API EXECUTE on internal trigger + maintenance SECURITY DEFINER functions.
-- These run only inside triggers / cron / edge functions (service_role bypasses grants),
-- so signed-in users and anon must not be able to call them through the API.

REVOKE EXECUTE ON FUNCTION public.set_partner_verification_deadline() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_default_role() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_voucher_redemptions() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_user_referral_code() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.initialize_user_points() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_partner_profile_fields() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_role_insert() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_venue_staff_fields() FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.cleanup_venue_search_cache() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_implicit_signals() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_request_logs() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_stale_sessions() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.insert_request_log(text, text, text, text, integer, boolean, integer, integer, jsonb) FROM anon, authenticated;
