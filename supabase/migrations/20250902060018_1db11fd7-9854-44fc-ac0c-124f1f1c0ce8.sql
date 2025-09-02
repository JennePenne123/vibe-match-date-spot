-- Step 1: Fix the immediate issue by manually updating the current session
UPDATE date_planning_sessions 
SET 
  both_preferences_complete = true,
  initiator_preferences = jsonb_build_object(
    'preferred_cuisines', ARRAY[]::text[],
    'preferred_vibes', ARRAY[]::text[],
    'preferred_price_range', ARRAY['$$']::text[],
    'preferred_times', ARRAY[]::text[],
    'max_distance', 15,
    'dietary_restrictions', ARRAY[]::text[]
  ),
  partner_preferences = jsonb_build_object(
    'preferred_cuisines', ARRAY[]::text[],
    'preferred_vibes', ARRAY[]::text[],
    'preferred_price_range', ARRAY['$$']::text[],
    'preferred_times', ARRAY[]::text[],
    'max_distance', 15,
    'dietary_restrictions', ARRAY[]::text[]
  )
WHERE id = '13392e34-5df2-4f84-89fa-6c39b861612f' AND session_status = 'active';