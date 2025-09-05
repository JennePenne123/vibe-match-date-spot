-- Clear all session preference flags to force users to re-set preferences properly
UPDATE date_planning_sessions 
SET 
  initiator_preferences_complete = false,
  partner_preferences_complete = false,
  both_preferences_complete = false,
  updated_at = now()
WHERE session_status = 'active' 
  AND created_at > now() - interval '24 hours';

-- Create a trigger to automatically update both_preferences_complete
CREATE OR REPLACE FUNCTION update_both_preferences_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if we're changing preference completion flags
  IF (TG_OP = 'UPDATE' AND (
    OLD.initiator_preferences_complete IS DISTINCT FROM NEW.initiator_preferences_complete OR
    OLD.partner_preferences_complete IS DISTINCT FROM NEW.partner_preferences_complete OR
    OLD.initiator_preferences IS DISTINCT FROM NEW.initiator_preferences OR
    OLD.partner_preferences IS DISTINCT FROM NEW.partner_preferences
  )) OR TG_OP = 'INSERT' THEN
    
    -- Calculate both_preferences_complete based on actual data consistency
    NEW.both_preferences_complete = (
      NEW.initiator_preferences_complete = true AND 
      NEW.partner_preferences_complete = true AND
      NEW.initiator_preferences IS NOT NULL AND 
      NEW.partner_preferences IS NOT NULL
    );
    
    -- Log the update for debugging
    RAISE NOTICE 'Session % both_preferences_complete updated to %', NEW.id, NEW.both_preferences_complete;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the table
DROP TRIGGER IF EXISTS trigger_update_both_preferences_complete ON date_planning_sessions;
CREATE TRIGGER trigger_update_both_preferences_complete
  BEFORE INSERT OR UPDATE ON date_planning_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_both_preferences_complete();