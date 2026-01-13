-- Create request_logs table for rate limit monitoring
CREATE TABLE public.request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  identifier_hash TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  was_rate_limited BOOLEAN DEFAULT FALSE,
  request_count INTEGER,
  limit_threshold INTEGER,
  client_ip_hash TEXT,
  user_agent TEXT,
  abuse_score INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

-- Indexes for efficient querying
CREATE INDEX idx_request_logs_timestamp ON public.request_logs(timestamp DESC);
CREATE INDEX idx_request_logs_identifier ON public.request_logs(identifier_hash);
CREATE INDEX idx_request_logs_rate_limited ON public.request_logs(was_rate_limited) WHERE was_rate_limited = TRUE;
CREATE INDEX idx_request_logs_abuse ON public.request_logs(abuse_score) WHERE abuse_score > 50;
CREATE INDEX idx_request_logs_function ON public.request_logs(function_name);

-- Enable RLS
ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;

-- Only service role can access logs (no public access)
CREATE POLICY "Service role only access"
  ON public.request_logs
  FOR ALL
  USING (false);

-- Daily rate limit summary view
CREATE VIEW public.rate_limit_daily_summary AS
SELECT 
  DATE(timestamp) as date,
  function_name,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE was_rate_limited) as blocked_requests,
  COUNT(DISTINCT identifier_hash) as unique_identifiers,
  ROUND(AVG(abuse_score) FILTER (WHERE was_rate_limited))::INTEGER as avg_abuse_score
FROM public.request_logs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp), function_name
ORDER BY date DESC, blocked_requests DESC;

-- Potential abusers view (repeat offenders)
CREATE VIEW public.potential_abusers AS
SELECT 
  identifier_hash,
  COUNT(*) as total_blocked,
  MAX(abuse_score) as max_abuse_score,
  array_agg(DISTINCT function_name) as targeted_functions,
  MAX(timestamp) as last_seen
FROM public.request_logs
WHERE was_rate_limited = TRUE
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY identifier_hash
HAVING COUNT(*) > 10
ORDER BY total_blocked DESC;

-- Auto-cleanup function: Delete logs older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_old_request_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.request_logs
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$;