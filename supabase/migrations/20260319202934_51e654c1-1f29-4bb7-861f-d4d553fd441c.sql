-- Add new preference columns to user_preferences
ALTER TABLE public.user_preferences 
  ADD COLUMN IF NOT EXISTS preferred_activities text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS preferred_entertainment text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS preferred_duration text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accessibility_needs text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS preferred_venue_types text[] DEFAULT NULL;