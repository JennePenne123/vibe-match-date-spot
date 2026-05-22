-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any prior version of this job, then schedule weekly (Sundays 03:30 UTC)
SELECT cron.unschedule('weekly-db-backup') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'weekly-db-backup'
);

SELECT cron.schedule(
  'weekly-db-backup',
  '30 3 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://dfjwubatslzblagthbdw.supabase.co/functions/v1/weekly-db-backup',
    headers := '{"Content-Type": "application/json", "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmand1YmF0c2x6YmxhZ3RoYmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjIzMTQsImV4cCI6MjA2NTczODMxNH0.OxA8Wt4JZPagCJW2DKxjnFJqPJFebzAkRXwleUvH0iE"}'::jsonb,
    body := jsonb_build_object('triggered_at', now())
  ) AS request_id;
  $$
);