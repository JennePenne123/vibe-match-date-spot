-- Add test preferences for the users in the profiles table
-- User 1: jennepenne123@gmail.com (ID: dbfe64ff-d75a-4032-af21-6c31bfdc4215)
INSERT INTO user_preferences (
  user_id,
  preferred_cuisines,
  preferred_price_range,
  preferred_times,
  preferred_vibes,
  max_distance,
  dietary_restrictions
) VALUES (
  'dbfe64ff-d75a-4032-af21-6c31bfdc4215',
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

-- User 2: janwiechmann@hotmail.com (ID: c733288b-7d22-427c-b6d3-43cfe2d0dcf7)
INSERT INTO user_preferences (
  user_id,
  preferred_cuisines,
  preferred_price_range,
  preferred_times,
  preferred_vibes,
  max_distance,
  dietary_restrictions
) VALUES (
  'c733288b-7d22-427c-b6d3-43cfe2d0dcf7',
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