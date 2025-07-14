-- Update all users to have Italian cuisine preference and clear other preferences for testing
UPDATE public.user_preferences 
SET 
  preferred_cuisines = ARRAY['Italian'],
  preferred_vibes = ARRAY[]::text[],
  preferred_times = ARRAY[]::text[],
  preferred_price_range = ARRAY['$$'],
  dietary_restrictions = ARRAY[]::text[],
  updated_at = now()
WHERE user_id IS NOT NULL;