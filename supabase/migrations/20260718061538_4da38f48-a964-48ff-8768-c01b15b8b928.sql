
CREATE OR REPLACE FUNCTION public.protect_date_group_member_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_creator boolean;
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  SELECT (dg.creator_id = auth.uid()) INTO is_creator
  FROM public.date_groups dg
  WHERE dg.id = OLD.group_id;

  IF COALESCE(is_creator, false) THEN
    -- creators may modify roles/status but not reassign to another group or user
    IF NEW.group_id IS DISTINCT FROM OLD.group_id THEN
      RAISE EXCEPTION 'Cannot change group_id of a membership';
    END IF;
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Cannot change user_id of a membership';
    END IF;
    RETURN NEW;
  END IF;

  -- Non-creator members: block privileged field changes
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Members cannot modify their role';
  END IF;
  IF NEW.group_id IS DISTINCT FROM OLD.group_id THEN
    RAISE EXCEPTION 'Members cannot change group_id';
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Members cannot change user_id';
  END IF;
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Members cannot change id';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_date_group_member_fields ON public.date_group_members;
CREATE TRIGGER trg_protect_date_group_member_fields
BEFORE UPDATE ON public.date_group_members
FOR EACH ROW EXECUTE FUNCTION public.protect_date_group_member_fields();
