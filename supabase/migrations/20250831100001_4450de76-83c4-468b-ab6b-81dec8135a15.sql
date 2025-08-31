-- Drop existing triggers and function with CASCADE
DROP TRIGGER IF EXISTS update_both_preferences_complete_trigger ON date_planning_sessions;
DROP TRIGGER IF EXISTS trigger_update_both_preferences_complete ON date_planning_sessions;
DROP FUNCTION IF EXISTS public.update_both_preferences_complete() CASCADE;

-- Create the corrected function
CREATE OR REPLACE FUNCTION public.update_both_preferences_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update both_preferences_complete based on individual completion flags
  NEW.both_preferences_complete = (
    COALESCE(NEW.initiator_preferences_complete, false) AND 
    COALESCE(NEW.partner_preferences_complete, false)
  );
  
  -- Also ensure we have both preference sets if we're checking for completion
  IF NEW.both_preferences_complete AND (
    NEW.initiator_preferences IS NULL OR 
    NEW.partner_preferences IS NULL
  ) THEN
    NEW.both_preferences_complete = false;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger on both INSERT and UPDATE
CREATE TRIGGER update_both_preferences_complete_trigger
  BEFORE INSERT OR UPDATE ON date_planning_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_both_preferences_complete();

-- Fix the current stuck session
UPDATE date_planning_sessions 
SET both_preferences_complete = true, updated_at = now()
WHERE id = '13392e34-5df2-4f84-89fa-6c39b861612f';

-- Fix empty user preferences with default values
UPDATE user_preferences 
SET 
  preferred_cuisines = ARRAY['Italian', 'American', 'Mexican']::text[],
  preferred_vibes = ARRAY['Casual', 'Cozy']::text[],
  preferred_times = ARRAY['Dinner (5-8 PM)', 'Evening (8-11 PM)']::text[],
  preferred_price_range = ARRAY['$$', '$$$']::text[],
  updated_at = now()
WHERE (
  preferred_cuisines = '{}' OR preferred_cuisines IS NULL OR
  preferred_vibes = '{}' OR preferred_vibes IS NULL OR  
  preferred_times = '{}' OR preferred_times IS NULL OR
  preferred_price_range = '{}' OR preferred_price_range IS NULL
);