-- Add preference completion tracking to date_planning_sessions
ALTER TABLE date_planning_sessions 
ADD COLUMN IF NOT EXISTS initiator_preferences_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS partner_preferences_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS both_preferences_complete boolean DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_date_planning_sessions_preferences_complete 
ON date_planning_sessions(both_preferences_complete, session_status);

-- Create function to update both_preferences_complete automatically
CREATE OR REPLACE FUNCTION update_both_preferences_complete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.both_preferences_complete = (NEW.initiator_preferences_complete AND NEW.partner_preferences_complete);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update both_preferences_complete
DROP TRIGGER IF EXISTS trigger_update_both_preferences_complete ON date_planning_sessions;
CREATE TRIGGER trigger_update_both_preferences_complete
  BEFORE UPDATE ON date_planning_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_both_preferences_complete();