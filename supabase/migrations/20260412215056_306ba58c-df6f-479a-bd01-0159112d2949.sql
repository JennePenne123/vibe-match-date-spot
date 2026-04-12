SELECT cron.schedule(
  'validate-venue-data-weekly',
  '0 3 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://dfjwubatslzblagthbdw.supabase.co/functions/v1/validate-venue-data',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmand1YmF0c2x6YmxhZ3RoYmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjIzMTQsImV4cCI6MjA2NTczODMxNH0.OxA8Wt4JZPagCJW2DKxjnFJqPJFebzAkRXwleUvH0iE"}'::jsonb,
    body := '{"dry_run": false, "limit": 50}'::jsonb
  ) AS request_id;
  $$
);