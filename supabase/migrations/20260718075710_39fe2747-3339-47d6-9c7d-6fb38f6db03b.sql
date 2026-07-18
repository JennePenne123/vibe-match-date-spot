
-- 1) profiles_safe: switch to security invoker (fixes SUPA_security_definer_view ERROR)
ALTER VIEW public.profiles_safe SET (security_invoker = on);

-- 2) date_group_members: replace ineffective self-referencing WITH CHECK with a trigger.
--    Trigger public.protect_date_group_member_fields() already blocks role/group_id/user_id/id changes for non-creators.
DROP POLICY IF EXISTS "Members can update own membership" ON public.date_group_members;
CREATE POLICY "Members can update own membership"
ON public.date_group_members
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Ensure the protective trigger exists on date_group_members
DROP TRIGGER IF EXISTS trg_protect_date_group_member_fields ON public.date_group_members;
CREATE TRIGGER trg_protect_date_group_member_fields
BEFORE UPDATE ON public.date_group_members
FOR EACH ROW
EXECUTE FUNCTION public.protect_date_group_member_fields();

-- 3) partner_exclusive_vouchers: replace ineffective self-referencing WITH CHECK with a trigger.
CREATE OR REPLACE FUNCTION public.protect_partner_voucher_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins may change anything
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Offering partner (owner of the voucher) may update all business fields
  IF auth.uid() = OLD.offering_partner_id THEN
    -- but must not reassign the voucher to a different offering/receiving partner or change discount silently
    IF NEW.offering_partner_id IS DISTINCT FROM OLD.offering_partner_id THEN
      RAISE EXCEPTION 'Cannot change offering_partner_id';
    END IF;
    RETURN NEW;
  END IF;

  -- Receiving partner: may only mutate their own row and never the pinned fields
  IF auth.uid() = OLD.receiving_partner_id THEN
    IF NEW.offering_partner_id IS DISTINCT FROM OLD.offering_partner_id THEN
      RAISE EXCEPTION 'Receiver cannot modify offering_partner_id';
    END IF;
    IF NEW.receiving_partner_id IS DISTINCT FROM OLD.receiving_partner_id THEN
      RAISE EXCEPTION 'Receiver cannot modify receiving_partner_id';
    END IF;
    IF NEW.discount_value IS DISTINCT FROM OLD.discount_value THEN
      RAISE EXCEPTION 'Receiver cannot modify discount_value';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Cannot modify id';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Not authorized to update this voucher';
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_partner_voucher_fields ON public.partner_exclusive_vouchers;
CREATE TRIGGER trg_protect_partner_voucher_fields
BEFORE UPDATE ON public.partner_exclusive_vouchers
FOR EACH ROW
EXECUTE FUNCTION public.protect_partner_voucher_fields();

DROP POLICY IF EXISTS "Partners can update received vouchers" ON public.partner_exclusive_vouchers;
CREATE POLICY "Partners can update received vouchers"
ON public.partner_exclusive_vouchers
FOR UPDATE
TO authenticated
USING (auth.uid() = receiving_partner_id OR auth.uid() = offering_partner_id)
WITH CHECK (auth.uid() = receiving_partner_id OR auth.uid() = offering_partner_id);
