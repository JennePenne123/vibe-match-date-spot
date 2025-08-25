-- Create database trigger to automatically update both_preferences_complete
-- This ensures consistency regardless of client-side logic

CREATE OR REPLACE FUNCTION update_both_preferences_complete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.both_preferences_complete = (NEW.initiator_preferences_complete AND NEW.partner_preferences_complete);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT and UPDATE operations
DROP TRIGGER IF EXISTS trigger_update_both_preferences_complete ON date_planning_sessions;
CREATE TRIGGER trigger_update_both_preferences_complete
  BEFORE INSERT OR UPDATE ON date_planning_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_both_preferences_complete();