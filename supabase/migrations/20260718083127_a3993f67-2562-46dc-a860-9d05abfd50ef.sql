-- Server-side admin verification RPC. SECURITY DEFINER + auth.uid() means
-- the client cannot spoof identity: the DB itself decides based on the JWT.
CREATE OR REPLACE FUNCTION public.verify_admin_access()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN false;
  END IF;
  RETURN public.has_role(uid, 'admin'::app_role)
      OR EXISTS (SELECT 1 FROM public.admin_team WHERE user_id = uid);
END;
$$;

-- Only authenticated users may execute; anon has no business calling this.
REVOKE ALL ON FUNCTION public.verify_admin_access() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_admin_access() TO authenticated;