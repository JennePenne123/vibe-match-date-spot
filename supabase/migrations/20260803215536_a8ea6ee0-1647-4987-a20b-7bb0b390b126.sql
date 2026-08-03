GRANT SELECT, INSERT, UPDATE, DELETE ON public.date_groups TO authenticated;
GRANT ALL ON public.date_groups TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.date_group_members TO authenticated;
GRANT ALL ON public.date_group_members TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.date_group_messages TO authenticated;
GRANT ALL ON public.date_group_messages TO service_role;