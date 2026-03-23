-- Mark all existing error logs as resolved (old build artifacts)
UPDATE error_logs SET resolved = true, resolved_at = now() WHERE resolved = false;

-- Delete expired planning sessions older than 30 days and their orphaned proposals
DELETE FROM date_proposals
WHERE planning_session_id IN (
  SELECT id FROM date_planning_sessions
  WHERE session_status = 'expired'
    AND updated_at < NOW() - INTERVAL '30 days'
)
AND status = 'pending';

DELETE FROM date_planning_sessions
WHERE session_status = 'expired'
  AND updated_at < NOW() - INTERVAL '30 days';