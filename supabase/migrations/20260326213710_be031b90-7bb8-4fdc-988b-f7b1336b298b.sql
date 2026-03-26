select cron.schedule(
  'check-verification-reminders-daily',
  '0 9 * * *',
  $$
  select
    net.http_post(
        url:='https://dfjwubatslzblagthbdw.supabase.co/functions/v1/check-verification-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmand1YmF0c2x6YmxhZ3RoYmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjIzMTQsImV4cCI6MjA2NTczODMxNH0.OxA8Wt4JZPagCJW2DKxjnFJqPJFebzAkRXwleUvH0iE"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);