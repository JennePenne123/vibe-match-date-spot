-- Fix the current session first
UPDATE public.date_planning_sessions 
SET both_preferences_complete = true,
    updated_at = now()
WHERE id = '13392e34-5df2-4f84-89fa-6c39b861612f'
  AND initiator_preferences_complete = true 
  AND partner_preferences_complete = true;

-- Create the trigger to automatically update both_preferences_complete
CREATE TRIGGER update_both_preferences_complete_trigger
    BEFORE UPDATE ON public.date_planning_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_both_preferences_complete();