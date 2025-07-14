-- Fix all users to have complete preferences for Smart Planner testing
UPDATE public.user_preferences 
SET 
  preferred_cuisines = ARRAY['Italian'],
  preferred_vibes = ARRAY['romantic'],
  preferred_times = ARRAY['evening'],
  preferred_price_range = ARRAY['$$'],
  dietary_restrictions = ARRAY[]::text[],
  updated_at = now()
WHERE user_id IS NOT NULL;