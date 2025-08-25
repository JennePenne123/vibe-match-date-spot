-- Create a trigger to automatically update both_preferences_complete when both individual flags are true
CREATE OR REPLACE FUNCTION public.update_both_preferences_complete()
RETURNS trigger AS $$
BEGIN
  -- Update both_preferences_complete based on individual completion flags
  NEW.both_preferences_complete = (NEW.initiator_preferences_complete AND NEW.partner_preferences_complete);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires before update on date_planning_sessions
DROP TRIGGER IF EXISTS trigger_update_both_preferences_complete ON public.date_planning_sessions;
CREATE TRIGGER trigger_update_both_preferences_complete
  BEFORE UPDATE ON public.date_planning_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_both_preferences_complete();