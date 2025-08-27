-- Create trigger to automatically update both_preferences_complete flag
DROP TRIGGER IF EXISTS update_both_preferences_complete_trigger ON date_planning_sessions;

CREATE TRIGGER update_both_preferences_complete_trigger
  BEFORE UPDATE ON date_planning_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_both_preferences_complete();