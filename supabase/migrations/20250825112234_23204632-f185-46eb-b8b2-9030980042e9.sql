-- Fix existing sessions where both individual preferences are complete but both_preferences_complete is false
UPDATE date_planning_sessions 
SET both_preferences_complete = true 
WHERE initiator_preferences_complete = true 
  AND partner_preferences_complete = true 
  AND both_preferences_complete = false;