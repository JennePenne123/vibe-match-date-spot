DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'api_usage_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.api_usage_logs;
  END IF;
END $$;