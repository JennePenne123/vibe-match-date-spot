CREATE OR REPLACE FUNCTION public.verify_admin_access_logged()
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  allowed boolean := false;
  actor_email_val text;
BEGIN
  IF uid IS NOT NULL THEN
    allowed := public.verify_admin_access();
    SELECT email INTO actor_email_val FROM auth.users WHERE id = uid;
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, actor_email, action, resource_type, metadata)
  VALUES (
    uid,
    actor_email_val,
    CASE WHEN allowed THEN 'admin_access_check.success' ELSE 'admin_access_check.denied' END,
    'admin_access',
    jsonb_build_object('granted', allowed, 'checked_at', now())
  );

  RETURN allowed;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_admin_access_logged() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_admin_access_logged() TO authenticated, service_role;