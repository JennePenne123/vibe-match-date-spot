-- Add separate columns for initiator and partner preferences to fix the overwriting issue
ALTER TABLE public.date_planning_sessions 
ADD COLUMN IF NOT EXISTS initiator_preferences jsonb,
ADD COLUMN IF NOT EXISTS partner_preferences jsonb;

-- Update the trigger function to also check if we have both sets of preferences
CREATE OR REPLACE FUNCTION public.update_both_preferences_complete()
RETURNS trigger AS $$
BEGIN
  -- Update both_preferences_complete based on individual completion flags
  NEW.both_preferences_complete = (NEW.initiator_preferences_complete AND NEW.partner_preferences_complete);
  
  -- Also ensure we have both preference sets
  IF NEW.both_preferences_complete AND (NEW.initiator_preferences IS NULL OR NEW.partner_preferences IS NULL) THEN
    NEW.both_preferences_complete = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;