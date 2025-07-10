-- Add test preferences for the other users in the database
-- First, let's add preferences for user ID: 6c84fb90-12c4-11e1-840d-7b25c5ee775a
INSERT INTO user_preferences (
  user_id,
  preferred_cuisines,
  preferred_price_range,
  preferred_times,
  preferred_vibes,
  max_distance,
  dietary_restrictions
) VALUES (
  '6c84fb90-12c4-11e1-840d-7b25c5ee775a',
  ARRAY['Mexican', 'American', 'Thai'],
  ARRAY['$', '$$'],
  ARRAY['lunch', 'dinner'],
  ARRAY['casual', 'lively', 'outdoor'],
  20,
  ARRAY['vegetarian']
) ON CONFLICT (user_id) DO UPDATE SET
  preferred_cuisines = EXCLUDED.preferred_cuisines,
  preferred_price_range = EXCLUDED.preferred_price_range,
  preferred_times = EXCLUDED.preferred_times,
  preferred_vibes = EXCLUDED.preferred_vibes,
  max_distance = EXCLUDED.max_distance,
  dietary_restrictions = EXCLUDED.dietary_restrictions,
  updated_at = now();

-- Add preferences for user ID: 110ec58a-a0f2-4ac4-8393-c866d813b8d1
INSERT INTO user_preferences (
  user_id,
  preferred_cuisines,
  preferred_price_range,
  preferred_times,
  preferred_vibes,
  max_distance,
  dietary_restrictions
) VALUES (
  '110ec58a-a0f2-4ac4-8393-c866d813b8d1',
  ARRAY['French', 'Mediterranean', 'Indian'],
  ARRAY['$$', '$$$'],
  ARRAY['dinner', 'late night'],
  ARRAY['upscale', 'romantic', 'quiet'],
  12,
  ARRAY['gluten-free']
) ON CONFLICT (user_id) DO UPDATE SET
  preferred_cuisines = EXCLUDED.preferred_cuisines,
  preferred_price_range = EXCLUDED.preferred_price_range,
  preferred_times = EXCLUDED.preferred_times,
  preferred_vibes = EXCLUDED.preferred_vibes,
  max_distance = EXCLUDED.max_distance,
  dietary_restrictions = EXCLUDED.dietary_restrictions,
  updated_at = now();