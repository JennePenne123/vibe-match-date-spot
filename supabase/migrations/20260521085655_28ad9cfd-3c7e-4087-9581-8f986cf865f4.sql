-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any existing schedule with same name
SELECT cron.unschedule('monthly-refresh-google-venues')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'monthly-refresh-google-venues');

-- Schedule monthly run on the 1st at 03:15 UTC
SELECT cron.schedule(
  'monthly-refresh-google-venues',
  '15 3 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://dfjwubatslzblagthbdw.supabase.co/functions/v1/refresh-google-venues',
    headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmand1YmF0c2x6YmxhZ3RoYmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjIzMTQsImV4cCI6MjA2NTczODMxNH0.OxA8Wt4JZPagCJW2DKxjnFJqPJFebzAkRXwleUvH0iE"}'::jsonb,
    body := jsonb_build_object('triggered_at', now(), 'refreshLimit', 200, 'discoveryLimit', 30)
  ) AS request_id;
  $$
);