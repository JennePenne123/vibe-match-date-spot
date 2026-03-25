
-- ===========================================
-- FIX 1: profiles_safe view - restrict email to owner only
-- ===========================================
DROP VIEW IF EXISTS public.profiles_safe;
CREATE VIEW public.profiles_safe WITH (security_invoker = on) AS
SELECT
  id,
  created_at,
  updated_at,
  name,
  avatar_url,
  CASE WHEN id = auth.uid() THEN email ELSE NULL END AS email
FROM public.profiles;

-- ===========================================
-- FIX 2: Venue policies - remove source-based bypass
-- ===========================================
DROP POLICY IF EXISTS "System can create venues from trusted sources" ON public.venues;
DROP POLICY IF EXISTS "System can update venues from trusted sources" ON public.venues;
DROP POLICY IF EXISTS "Admins and partners can insert venues" ON public.venues;

CREATE POLICY "Admins and partners can insert venues"
ON public.venues FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'venue_partner'::app_role)
);

CREATE POLICY "Admins can update any venue"
ON public.venues FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ===========================================
-- FIX 3: RLS always-true on api_usage_logs INSERT
-- ===========================================
DROP POLICY IF EXISTS "Edge functions can insert api logs" ON public.api_usage_logs;
CREATE POLICY "Edge functions can insert api logs"
ON public.api_usage_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ===========================================
-- FIX 4: Rate-limiting views - restrict to admin via security_invoker
-- ===========================================
DROP VIEW IF EXISTS public.potential_abusers;
CREATE VIEW public.potential_abusers WITH (security_invoker = on) AS
SELECT
  identifier_hash,
  COUNT(*) FILTER (WHERE was_rate_limited = true) AS total_blocked,
  MAX(abuse_score) AS max_abuse_score,
  MAX(timestamp) AS last_seen,
  ARRAY_AGG(DISTINCT function_name) AS targeted_functions
FROM public.request_logs
GROUP BY identifier_hash
HAVING COUNT(*) FILTER (WHERE was_rate_limited = true) > 5;

DROP VIEW IF EXISTS public.rate_limit_daily_summary;
CREATE VIEW public.rate_limit_daily_summary WITH (security_invoker = on) AS
SELECT
  DATE(timestamp) AS date,
  function_name,
  COUNT(*) AS total_requests,
  COUNT(*) FILTER (WHERE was_rate_limited = true) AS blocked_requests,
  COUNT(DISTINCT identifier_hash) AS unique_identifiers,
  AVG(abuse_score)::integer AS avg_abuse_score
FROM public.request_logs
GROUP BY DATE(timestamp), function_name;

DROP VIEW IF EXISTS public.api_usage_daily;
CREATE VIEW public.api_usage_daily WITH (security_invoker = on) AS
SELECT
  DATE(created_at) AS date,
  api_name,
  COUNT(*) AS total_requests,
  COUNT(*) FILTER (WHERE cache_hit = true) AS cache_hits,
  AVG(response_time_ms)::integer AS avg_response_time,
  SUM(estimated_cost) AS total_cost
FROM public.api_usage_logs
GROUP BY DATE(created_at), api_name;

-- ===========================================
-- FIX 5: Leaderboard view - add security_invoker
-- ===========================================
DROP VIEW IF EXISTS public.leaderboard_view;
CREATE VIEW public.leaderboard_view WITH (security_invoker = on) AS
SELECT
  user_id,
  total_points,
  level,
  streak_count
FROM public.user_points
ORDER BY total_points DESC
LIMIT 100;

-- ===========================================
-- FIX 6: Partner profile UPDATE requires venue_partner role
-- ===========================================
DROP POLICY IF EXISTS "Partners can update own profile" ON public.partner_profiles;
CREATE POLICY "Partners can update own profile"
ON public.partner_profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND has_role(auth.uid(), 'venue_partner'::app_role));
