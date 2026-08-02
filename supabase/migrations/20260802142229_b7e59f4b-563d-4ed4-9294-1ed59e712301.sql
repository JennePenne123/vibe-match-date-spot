ALTER TABLE public.date_group_members REPLICA IDENTITY FULL;
ALTER TABLE public.date_groups REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'date_group_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.date_group_members;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_rel pr
    JOIN pg_publication p ON p.oid = pr.prpubid
    JOIN pg_class c ON c.oid = pr.prrelid
    WHERE p.pubname = 'supabase_realtime' AND c.relname = 'date_groups'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.date_groups;
  END IF;
END $$;