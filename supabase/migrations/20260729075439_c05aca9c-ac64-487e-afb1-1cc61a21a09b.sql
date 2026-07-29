DROP TRIGGER IF EXISTS trg_protect_partner_profile_fields ON public.partner_profiles;
CREATE TRIGGER trg_protect_partner_profile_fields
BEFORE UPDATE ON public.partner_profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_partner_profile_fields();

DROP TRIGGER IF EXISTS trg_protect_partner_voucher_fields ON public.partner_exclusive_vouchers;
CREATE TRIGGER trg_protect_partner_voucher_fields
BEFORE UPDATE ON public.partner_exclusive_vouchers
FOR EACH ROW EXECUTE FUNCTION public.protect_partner_voucher_fields();