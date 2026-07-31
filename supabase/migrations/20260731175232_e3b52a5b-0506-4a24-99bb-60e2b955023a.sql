REVOKE ALL ON FUNCTION public.protect_date_group_member_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_partner_voucher_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_admin_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin_owner(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_friend_preferences(uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.protect_date_group_member_fields() TO service_role;
GRANT EXECUTE ON FUNCTION public.protect_partner_voucher_fields() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_role(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_owner(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_friend_preferences(uuid) TO service_role;