-- Force trigger the update by manually setting both_preferences_complete
UPDATE date_planning_sessions 
SET both_preferences_complete = (
  COALESCE(initiator_preferences_complete, false) AND 
  COALESCE(partner_preferences_complete, false)
)
WHERE id = '13392e34-5df2-4f84-89fa-6c39b861612f';