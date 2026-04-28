
-- 1. Restrict SELECT: staff can only see their own row, not other colleagues
DROP POLICY IF EXISTS "Partners can view their staff" ON public.venue_staff;

CREATE POLICY "Partners and admins can view all staff"
ON public.venue_staff
FOR SELECT
TO authenticated
USING (partner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view their own record"
ON public.venue_staff
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. Restrict UPDATE: split into partner/admin (full) and staff (limited)
DROP POLICY IF EXISTS "Partners can update staff" ON public.venue_staff;

CREATE POLICY "Partners and admins can update staff"
ON public.venue_staff
FOR UPDATE
TO authenticated
USING (partner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (partner_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Staff may update their own record but a trigger blocks privileged field changes
CREATE POLICY "Staff can update own record limited"
ON public.venue_staff
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 3. Trigger to prevent staff from modifying privileged fields
CREATE OR REPLACE FUNCTION public.protect_venue_staff_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Partners and admins may change anything
  IF auth.uid() = OLD.partner_id OR public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- For everyone else (i.e. staff updating their own row), block privileged fields
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
$$;

DROP TRIGGER IF EXISTS protect_venue_staff_fields_trigger ON public.venue_staff;
CREATE TRIGGER protect_venue_staff_fields_trigger
BEFORE UPDATE ON public.venue_staff
FOR EACH ROW
EXECUTE FUNCTION public.protect_venue_staff_fields();
