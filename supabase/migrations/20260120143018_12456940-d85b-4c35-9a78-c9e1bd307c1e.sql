-- Fix security definer views - add security_invoker = on
-- Drop and recreate the 3 views that are missing security_invoker

-- 1. Rate limit daily summary
DROP VIEW IF EXISTS public.rate_limit_daily_summary;
CREATE VIEW public.rate_limit_daily_summary
WITH (security_invoker = on)
AS
SELECT date("timestamp") AS date,
    function_name,
    count(*) AS total_requests,
    count(*) FILTER (WHERE was_rate_limited) AS blocked_requests,
    count(DISTINCT identifier_hash) AS unique_identifiers,
    round(avg(abuse_score) FILTER (WHERE was_rate_limited))::integer AS avg_abuse_score
FROM request_logs
WHERE "timestamp" > (now() - '30 days'::interval)
GROUP BY date("timestamp"), function_name
ORDER BY date("timestamp") DESC, count(*) FILTER (WHERE was_rate_limited) DESC;

-- 2. Potential abusers
DROP VIEW IF EXISTS public.potential_abusers;
CREATE VIEW public.potential_abusers
WITH (security_invoker = on)
AS
SELECT identifier_hash,
    count(*) AS total_blocked,
    max(abuse_score) AS max_abuse_score,
    array_agg(DISTINCT function_name) AS targeted_functions,
    max("timestamp") AS last_seen
FROM request_logs
WHERE was_rate_limited = true AND "timestamp" > (now() - '7 days'::interval)
GROUP BY identifier_hash
HAVING count(*) > 10
ORDER BY count(*) DESC;

-- 3. API usage daily
DROP VIEW IF EXISTS public.api_usage_daily;
CREATE VIEW public.api_usage_daily
WITH (security_invoker = on)
AS
SELECT date(created_at) AS date,
    api_name,
    count(*) AS total_calls,
    sum(estimated_cost) AS total_cost,
    avg(response_time_ms)::integer AS avg_response_time_ms,
    count(*) FILTER (WHERE response_status >= 400) AS error_count,
    count(*) FILTER (WHERE cache_hit = true) AS cache_hits
FROM api_usage_logs
GROUP BY date(created_at), api_name;