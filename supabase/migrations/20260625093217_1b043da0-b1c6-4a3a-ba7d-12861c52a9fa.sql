-- =====================================================================
-- SECURITY FINDING FIXES
-- =====================================================================

-- ---------------------------------------------------------------------
-- Findings 0028 / 0029: Lock down EXECUTE on SECURITY DEFINER functions
-- ---------------------------------------------------------------------

-- Trigger functions: only invoked by triggers, never called directly.
REVOKE ALL ON FUNCTION public.assign_default_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_user_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_voucher_redemptions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.initialize_user_points() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_partner_profile_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_venue_staff_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_partner_verification_deadline() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_role_insert() FROM PUBLIC, anon, authenticated;

-- Internal / cron-only functions: executed by scheduled jobs as service_role.
REVOKE ALL ON FUNCTION public.cleanup_old_implicit_signals() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_old_request_logs() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_stale_sessions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_venue_search_cache() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.insert_request_log(text, text, text, text, integer, boolean, integer, integer, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_implicit_signals() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_request_logs() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_stale_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_venue_search_cache() TO service_role;
GRANT EXECUTE ON FUNCTION public.insert_request_log(text, text, text, text, integer, boolean, integer, integer, jsonb) TO service_role;

-- Client-callable RPCs: remove anon/public, keep signed-in users + backend.
REVOKE ALL ON FUNCTION public.award_user_points(uuid, integer, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.award_user_points(uuid, integer, jsonb, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.count_perfect_pairs(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_test_venues(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_user_data(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_city_venue_rankings(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_cron_jobs_status() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_friend_preferences(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_retention_metrics(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reset_user_preferences_to_default(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.setup_test_user_preferences(uuid, text[], text[], text[], text[], integer, text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_user_streak(uuid, integer, timestamp with time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_user_points(uuid, integer, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.award_user_points(uuid, integer, jsonb, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.count_perfect_pairs(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_test_venues(jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.delete_user_data(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_city_venue_rankings(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_cron_jobs_status() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_friend_preferences(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_retention_metrics(integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_user_preferences_to_default(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.setup_test_user_preferences(uuid, text[], text[], text[], text[], integer, text[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_user_streak(uuid, integer, timestamp with time zone) TO authenticated, service_role;

-- RLS helper functions: needed by signed-in users inside policies, never by anon.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin_owner(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_admin_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_owner(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_role(uuid) TO authenticated, service_role;

-- ---------------------------------------------------------------------
-- Finding: venue_staff_update_no_column_restriction
-- Harden the column-block trigger so staff can never change privileged
-- fields, even if the broad self-update RLS policy is hit. The trigger
-- runs BEFORE UPDATE and cannot be bypassed by client RLS or RPCs.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_venue_staff_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Partners (owner of the record) and admins may change anything.
  IF auth.uid() = OLD.partner_id OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- For everyone else (staff updating their own row), block privileged fields.
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Staff cannot modify id';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Staff cannot modify user_id';
  END IF;
  IF NEW.partner_id IS DISTINCT FROM OLD.partner_id THEN
    RAISE EXCEPTION 'Staff cannot modify partner_id';
  END IF;
  IF NEW.staff_role IS DISTINCT FROM OLD.staff_role THEN
    RAISE EXCEPTION 'Staff cannot modify staff_role';
  END IF;
  IF NEW.venue_id IS DISTINCT FROM OLD.venue_id THEN
    RAISE EXCEPTION 'Staff cannot modify venue_id';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'Staff cannot modify status';
  END IF;
  IF NEW.qr_code_token IS DISTINCT FROM OLD.qr_code_token THEN
    RAISE EXCEPTION 'Staff cannot modify qr_code_token';
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure the protection trigger is attached (idempotent re-create).
DROP TRIGGER IF EXISTS protect_venue_staff_fields_trigger ON public.venue_staff;
CREATE TRIGGER protect_venue_staff_fields_trigger
  BEFORE UPDATE ON public.venue_staff
  FOR EACH ROW EXECUTE FUNCTION public.protect_venue_staff_fields();

-- ---------------------------------------------------------------------
-- Finding: db_backups_no_insert_policy
-- Make the intended access model explicit: only admins (and service_role,
-- which bypasses RLS) may write to the private 'db-backups' bucket.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can upload db backups" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update db backups" ON storage.objects;

CREATE POLICY "Admins can upload db backups"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'db-backups' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update db backups"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'db-backups' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'db-backups' AND public.has_role(auth.uid(), 'admin'::app_role));

-- ---------------------------------------------------------------------
-- Finding: profiles_friend_visibility
-- Friend/leaderboard lookups must work without ever exposing emails.
-- profiles_safe becomes a SECURITY DEFINER view exposing ONLY the
-- non-sensitive fields (id, name, avatar_url). The base profiles table
-- keeps its strict own-row SELECT policy, so emails are never readable
-- by other users.
-- ---------------------------------------------------------------------
DROP VIEW IF EXISTS public.profiles_safe;
CREATE VIEW public.profiles_safe
WITH (security_invoker = off) AS
SELECT id, name, avatar_url
FROM public.profiles;

REVOKE ALL ON public.profiles_safe FROM PUBLIC, anon;
GRANT SELECT ON public.profiles_safe TO authenticated, service_role;