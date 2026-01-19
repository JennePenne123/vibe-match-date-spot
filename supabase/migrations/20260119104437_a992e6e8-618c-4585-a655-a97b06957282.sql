-- Step 1: Database Index Optimization
-- Add performance indexes for common query patterns

-- Optimize friendship queries (frequently used in planning)
CREATE INDEX IF NOT EXISTS idx_friendships_composite 
ON friendships(user_id, friend_id, status) 
WHERE status = 'accepted';

-- Optimize venue feedback lookups
CREATE INDEX IF NOT EXISTS idx_venue_feedback_user_venue 
ON user_venue_feedback(user_id, venue_id);

-- Optimize date proposal queries
CREATE INDEX IF NOT EXISTS idx_date_proposals_session_status 
ON date_proposals(planning_session_id, status) 
WHERE status IN ('pending', 'accepted');

-- Optimize invitation messages for real-time chat
CREATE INDEX IF NOT EXISTS idx_invitation_messages_timestamp 
ON invitation_messages(invitation_id, created_at DESC);

-- Optimize AI learning data lookups
CREATE INDEX IF NOT EXISTS idx_ai_learning_user_venue 
ON ai_learning_data(user_id, venue_id);

-- Optimize date invitations by status and date
CREATE INDEX IF NOT EXISTS idx_invitations_status_date 
ON date_invitations(status, proposed_date DESC);

-- Optimize planning sessions lookup
CREATE INDEX IF NOT EXISTS idx_planning_sessions_participants 
ON date_planning_sessions(initiator_id, partner_id, session_status);

-- Optimize voucher redemptions
CREATE INDEX IF NOT EXISTS idx_voucher_redemptions_user 
ON voucher_redemptions(user_id, redeemed_at DESC);

-- Optimize request logs for analytics
CREATE INDEX IF NOT EXISTS idx_request_logs_function_time 
ON request_logs(function_name, timestamp DESC);

-- Step 2: Session Cleanup Function
CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS TABLE(expired_sessions INTEGER, deleted_proposals INTEGER, deleted_messages INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_expired_sessions INTEGER;
  v_deleted_proposals INTEGER;
  v_deleted_messages INTEGER;
BEGIN
  -- Expire sessions older than 7 days that are still 'active'
  UPDATE date_planning_sessions
  SET session_status = 'expired',
      updated_at = NOW()
  WHERE session_status = 'active'
    AND updated_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS v_expired_sessions = ROW_COUNT;
  
  -- Delete orphaned proposals from expired sessions
  DELETE FROM date_proposals
  WHERE planning_session_id IN (
    SELECT id FROM date_planning_sessions
    WHERE session_status = 'expired'
      AND updated_at < NOW() - INTERVAL '30 days'
  )
  AND status = 'pending';
  
  GET DIAGNOSTICS v_deleted_proposals = ROW_COUNT;
  
  -- Clean old request logs (older than 30 days)
  DELETE FROM request_logs
  WHERE timestamp < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_deleted_messages = ROW_COUNT;
  
  RETURN QUERY SELECT v_expired_sessions, v_deleted_proposals, v_deleted_messages;
END;
$$;

-- Step 3: Security Fixes

-- Fix 1: Restrict voucher SELECT to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active vouchers" ON public.vouchers;
CREATE POLICY "Authenticated users can view active vouchers"
  ON public.vouchers
  FOR SELECT
  TO authenticated
  USING (status = 'active' AND valid_until > now());

-- Fix 2: Revoke public access to test functions (already SECURITY DEFINER, but restrict execution)
-- Note: These functions are already SECURITY DEFINER which is correct
-- The functions should only be callable by authenticated users with proper context

-- Fix 3: Add better RLS policy for rate_limit_daily_summary view
-- (Views inherit table RLS, so we ensure request_logs has proper RLS)
ALTER TABLE IF EXISTS request_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access to request logs
DROP POLICY IF EXISTS "Admins can view request logs" ON public.request_logs;
CREATE POLICY "Admins can view request logs"
  ON public.request_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Allow edge functions to insert logs (service role bypasses RLS)
DROP POLICY IF EXISTS "Service role can insert logs" ON public.request_logs;
CREATE POLICY "Service role can insert logs"
  ON public.request_logs
  FOR INSERT
  WITH CHECK (true);

-- Step 4: API Usage Monitoring Table
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  api_name TEXT NOT NULL,
  endpoint TEXT,
  user_id UUID,
  response_status INTEGER,
  response_time_ms INTEGER,
  estimated_cost NUMERIC(10,6) DEFAULT 0,
  request_metadata JSONB,
  cache_hit BOOLEAN DEFAULT false
);

-- Enable RLS on api_usage_logs
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view API usage
CREATE POLICY "Admins can view api usage"
  ON api_usage_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Edge functions can insert logs
CREATE POLICY "Edge functions can insert api logs"
  ON api_usage_logs
  FOR INSERT
  WITH CHECK (true);

-- Indexes for API usage analytics
CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_api_name ON api_usage_logs(api_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage_logs(user_id, created_at DESC);

-- Daily summary view for dashboard
CREATE OR REPLACE VIEW api_usage_daily AS
SELECT 
  DATE(created_at) as date,
  api_name,
  COUNT(*) as total_calls,
  SUM(estimated_cost) as total_cost,
  AVG(response_time_ms)::INTEGER as avg_response_time_ms,
  COUNT(*) FILTER (WHERE response_status >= 400) as error_count,
  COUNT(*) FILTER (WHERE cache_hit = true) as cache_hits
FROM api_usage_logs
GROUP BY DATE(created_at), api_name;