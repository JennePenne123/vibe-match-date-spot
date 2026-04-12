-- 1. Protect user_roles from privilege escalation via SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.validate_role_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow the assign_default_role trigger (called from auth.users insert, no auth context)
  -- It only inserts 'regular' role
  IF NEW.role = 'regular' THEN
    RETURN NEW;
  END IF;
  
  -- For non-regular roles, require admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can assign non-regular roles';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_role_insert_trigger
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_role_insert();

-- 2. Remove vouchers and voucher_redemptions from Realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE public.vouchers;
ALTER PUBLICATION supabase_realtime DROP TABLE public.voucher_redemptions;