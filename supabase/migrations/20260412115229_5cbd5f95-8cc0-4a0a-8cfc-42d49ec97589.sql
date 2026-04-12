-- Attach the existing protection function as a trigger
CREATE TRIGGER protect_partner_profile_fields_trigger
  BEFORE UPDATE ON public.partner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_partner_profile_fields();