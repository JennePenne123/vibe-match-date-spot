-- Fix SECURITY DEFINER functions to add proper authorization checks
-- This prevents unauthorized users from modifying other users' preferences or creating venues

-- 1. Fix setup_test_user_preferences - require user to modify their own preferences OR be admin
CREATE OR REPLACE FUNCTION public.setup_test_user_preferences(
  target_user_id UUID,
  cuisines TEXT[] DEFAULT NULL,
  vibes TEXT[] DEFAULT NULL,
  times TEXT[] DEFAULT NULL,
  price_range TEXT[] DEFAULT NULL,
  max_dist INTEGER DEFAULT NULL,
  dietary TEXT[] DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $func$
DECLARE
  default_price text[] := ARRAY['$' || '$'];
BEGIN
  -- Authorization check: only allow user to modify their own preferences OR admin
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != target_user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify other users preferences';
  END IF;

  INSERT INTO public.user_preferences (
    user_id,
    preferred_cuisines,
    preferred_vibes,
    preferred_times,
    preferred_price_range,
    max_distance,
    dietary_restrictions,
    updated_at
  ) VALUES (
    target_user_id,
    COALESCE(cuisines, ARRAY['Italian']),
    COALESCE(vibes, ARRAY['casual']),
    COALESCE(times, ARRAY['lunch']),
    COALESCE(price_range, default_price),
    COALESCE(max_dist, 15),
    COALESCE(dietary, ARRAY[]::text[]),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    preferred_cuisines = EXCLUDED.preferred_cuisines,
    preferred_vibes = EXCLUDED.preferred_vibes,
    preferred_times = EXCLUDED.preferred_times,
    preferred_price_range = EXCLUDED.preferred_price_range,
    max_distance = EXCLUDED.max_distance,
    dietary_restrictions = EXCLUDED.dietary_restrictions,
    updated_at = now();
    
  RETURN true;
END;
$func$;

-- 2. Fix reset_user_preferences_to_default - require user to reset their own preferences OR be admin
CREATE OR REPLACE FUNCTION public.reset_user_preferences_to_default(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $func$
DECLARE
  default_price text[] := ARRAY['$' || '$'];
BEGIN
  -- Authorization check: only allow user to modify their own preferences OR admin
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != target_user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Cannot reset other users preferences';
  END IF;

  INSERT INTO public.user_preferences (
    user_id,
    preferred_cuisines,
    preferred_vibes,
    preferred_times,
    preferred_price_range,
    max_distance,
    dietary_restrictions,
    updated_at
  ) VALUES (
    target_user_id,
    ARRAY['Italian'],
    ARRAY['casual'],
    ARRAY['lunch'],
    default_price,
    15,
    ARRAY[]::text[],
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    preferred_cuisines = EXCLUDED.preferred_cuisines,
    preferred_vibes = EXCLUDED.preferred_vibes,
    preferred_times = EXCLUDED.preferred_times,
    preferred_price_range = EXCLUDED.preferred_price_range,
    max_distance = EXCLUDED.max_distance,
    dietary_restrictions = EXCLUDED.dietary_restrictions,
    updated_at = now();
    
  RETURN true;
END;
$func$;

-- 3. Fix create_test_venues - restrict to admin role only
CREATE OR REPLACE FUNCTION public.create_test_venues(venues_data JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $func$
DECLARE
  venue_record JSONB;
BEGIN
  -- Authorization check: only allow admin to create venues
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can create venues';
  END IF;

  -- Process each venue in the JSONB array
  FOR venue_record IN SELECT * FROM jsonb_array_elements(venues_data) LOOP
    INSERT INTO public.venues (
      id,
      name,
      address,
      cuisine_type,
      price_range,
      rating,
      tags,
      description,
      latitude,
      longitude,
      is_active
    ) VALUES (
      venue_record->>'id',
      venue_record->>'name', 
      venue_record->>'address',
      venue_record->>'cuisine_type',
      venue_record->>'price_range',
      (venue_record->>'rating')::numeric,
      ARRAY(SELECT jsonb_array_elements_text(venue_record->'tags')),
      venue_record->>'description',
      (venue_record->>'latitude')::numeric,
      (venue_record->>'longitude')::numeric,
      (venue_record->>'is_active')::boolean
    )
    ON CONFLICT (id) 
    DO UPDATE SET
      name = EXCLUDED.name,
      address = EXCLUDED.address,
      cuisine_type = EXCLUDED.cuisine_type,
      price_range = EXCLUDED.price_range,
      rating = EXCLUDED.rating,
      tags = EXCLUDED.tags,
      description = EXCLUDED.description,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      is_active = EXCLUDED.is_active,
      updated_at = now();
  END LOOP;
  
  RETURN true;
END;
$func$;