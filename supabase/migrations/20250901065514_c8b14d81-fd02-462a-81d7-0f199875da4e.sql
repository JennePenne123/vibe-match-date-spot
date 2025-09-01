-- Check current state and force update with explicit values
SELECT id, both_preferences_complete, initiator_preferences_complete, partner_preferences_complete 
FROM date_planning_sessions 
WHERE id = '13392e34-5df2-4f84-89fa-6c39b861612f';

-- Force set both_preferences_complete directly
UPDATE date_planning_sessions 
SET both_preferences_complete = TRUE,
    updated_at = now()
WHERE id = '13392e34-5df2-4f84-89fa-6c39b861612f';

-- Verify the update
SELECT id, both_preferences_complete, initiator_preferences_complete, partner_preferences_complete 
FROM date_planning_sessions 
WHERE id = '13392e34-5df2-4f84-89fa-6c39b861612f';