-- Reset session preference flags for the current problematic session
UPDATE date_planning_sessions 
SET 
  initiator_preferences_complete = false,
  partner_preferences_complete = false,
  both_preferences_complete = false,
  updated_at = now()
WHERE id = '13392e34-5df2-4f84-89fa-6c39b861612f';

-- Also reset any other recent active sessions that might have stale flags
UPDATE date_planning_sessions 
SET 
  initiator_preferences_complete = false,
  partner_preferences_complete = false,
  both_preferences_complete = false,
  updated_at = now()
WHERE session_status = 'active' 
  AND created_at > now() - interval '1 hour'
  AND (initiator_preferences_complete = true OR partner_preferences_complete = true);