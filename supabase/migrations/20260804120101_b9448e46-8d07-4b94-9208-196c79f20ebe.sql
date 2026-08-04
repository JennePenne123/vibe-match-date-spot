CREATE OR REPLACE FUNCTION public.protect_partner_voucher_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  IF auth.uid() = OLD.offering_partner_id THEN
    IF NEW.offering_partner_id IS DISTINCT FROM OLD.offering_partner_id THEN
      RAISE EXCEPTION 'Cannot change offering_partner_id';
    END IF;
    IF NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Cannot modify id';
    END IF;
    RETURN NEW;
  END IF;

  IF auth.uid() = OLD.receiving_partner_id THEN
    -- Receiver may ONLY change status and redeemed_at
    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.offering_partner_id IS DISTINCT FROM OLD.offering_partner_id
       OR NEW.receiving_partner_id IS DISTINCT FROM OLD.receiving_partner_id
       OR NEW.offering_venue_id IS DISTINCT FROM OLD.offering_venue_id
       OR NEW.title IS DISTINCT FROM OLD.title
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.discount_type IS DISTINCT FROM OLD.discount_type
       OR NEW.discount_value IS DISTINCT FROM OLD.discount_value
       OR NEW.code IS DISTINCT FROM OLD.code
       OR NEW.valid_until IS DISTINCT FROM OLD.valid_until
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Receiver may only update status and redeemed_at';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status NOT IN ('redeemed', 'declined', 'accepted', 'expired') THEN
      RAISE EXCEPTION 'Invalid status transition';
    END IF;
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Not authorized to update this voucher';
END;
$$;