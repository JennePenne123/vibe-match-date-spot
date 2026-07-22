
-- 1. Audit log table
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_hash text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log (created_at DESC);
CREATE INDEX idx_admin_audit_log_actor ON public.admin_audit_log (actor_id, created_at DESC);
CREATE INDEX idx_admin_audit_log_action ON public.admin_audit_log (action, created_at DESC);

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (public.verify_admin_access());

-- No INSERT/UPDATE/DELETE policies: only SECURITY DEFINER functions may write.

-- 2. Logging function callable from app code
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action text,
  _resource_type text DEFAULT NULL,
  _resource_id text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  actor_email_val text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.verify_admin_access() THEN
    RAISE EXCEPTION 'Unauthorized: admin required';
  END IF;

  SELECT email INTO actor_email_val FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.admin_audit_log (actor_id, actor_email, action, resource_type, resource_id, metadata)
  VALUES (auth.uid(), actor_email_val, _action, _resource_type, _resource_id, COALESCE(_metadata, '{}'::jsonb))
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_admin_action(text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_admin_action(text, text, text, jsonb) TO authenticated;

-- 3. Trigger function for automatic logging of sensitive table changes
CREATE OR REPLACE FUNCTION public.audit_sensitive_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_email_val text;
  resource_id_val text;
  meta jsonb;
BEGIN
  SELECT email INTO actor_email_val FROM auth.users WHERE id = auth.uid();

  IF TG_OP = 'DELETE' THEN
    resource_id_val := COALESCE(OLD.id::text, '');
    meta := jsonb_build_object('old', to_jsonb(OLD));
  ELSIF TG_OP = 'INSERT' THEN
    resource_id_val := COALESCE(NEW.id::text, '');
    meta := jsonb_build_object('new', to_jsonb(NEW));
  ELSE
    resource_id_val := COALESCE(NEW.id::text, '');
    meta := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
  END IF;

  INSERT INTO public.admin_audit_log (actor_id, actor_email, action, resource_type, resource_id, metadata)
  VALUES (
    auth.uid(),
    actor_email_val,
    TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    resource_id_val,
    meta
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Attach triggers to sensitive tables
DROP TRIGGER IF EXISTS trg_audit_user_roles ON public.user_roles;
CREATE TRIGGER trg_audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();

DROP TRIGGER IF EXISTS trg_audit_admin_team ON public.admin_team;
CREATE TRIGGER trg_audit_admin_team
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_team
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();

DROP TRIGGER IF EXISTS trg_audit_feature_flags ON public.feature_flags;
CREATE TRIGGER trg_audit_feature_flags
  AFTER INSERT OR UPDATE OR DELETE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_change();

-- 5. MFA-aware admin verification
CREATE OR REPLACE FUNCTION public.verify_admin_access_mfa()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  is_admin_val boolean := false;
  has_factor boolean := false;
  session_aal text;
  aal2_verified boolean := false;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('is_admin', false, 'has_mfa_factor', false, 'aal2', false);
  END IF;

  is_admin_val := public.verify_admin_access();

  -- Any verified TOTP factor for this user?
  SELECT EXISTS (
    SELECT 1 FROM auth.mfa_factors
    WHERE user_id = uid AND status = 'verified'
  ) INTO has_factor;

  -- Current session AAL from JWT
  session_aal := COALESCE(auth.jwt() ->> 'aal', 'aal1');
  aal2_verified := session_aal = 'aal2';

  RETURN jsonb_build_object(
    'is_admin', is_admin_val,
    'has_mfa_factor', has_factor,
    'aal2', aal2_verified
  );
END;
$$;

REVOKE ALL ON FUNCTION public.verify_admin_access_mfa() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_admin_access_mfa() TO authenticated;
