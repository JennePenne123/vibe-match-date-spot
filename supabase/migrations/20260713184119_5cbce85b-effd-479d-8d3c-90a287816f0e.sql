
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.set_partner_verification_deadline()',
    'public.assign_default_role()',
    'public.increment_voucher_redemptions()',
    'public.generate_user_referral_code()',
    'public.handle_new_user()',
    'public.initialize_user_points()',
    'public.protect_partner_profile_fields()',
    'public.update_updated_at_column()',
    'public.validate_role_insert()',
    'public.protect_venue_staff_fields()',
    'public.cleanup_venue_search_cache()',
    'public.cleanup_old_implicit_signals()',
    'public.cleanup_old_request_logs()',
    'public.cleanup_stale_sessions()',
    'public.insert_request_log(text, text, text, text, integer, boolean, integer, integer, jsonb)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated;', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role;', fn);
  END LOOP;
END $$;
