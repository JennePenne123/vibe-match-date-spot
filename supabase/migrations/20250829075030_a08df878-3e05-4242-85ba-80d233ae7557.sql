-- Fix remaining function security issues and tighten RLS policies

-- Update the update_updated_at_column function to be secure
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$function$;

-- Update other database functions to have secure search paths
CREATE OR REPLACE FUNCTION public.setup_test_user_preferences(target_user_id uuid, cuisines text[] DEFAULT NULL::text[], vibes text[] DEFAULT NULL::text[], times text[] DEFAULT NULL::text[], price_range text[] DEFAULT NULL::text[], max_dist integer DEFAULT NULL::integer, dietary text[] DEFAULT NULL::text[])
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  default_price text[] := ARRAY['$$'];
BEGIN
  -- This function runs with elevated privileges and can bypass RLS
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
$function$;

CREATE OR REPLACE FUNCTION public.reset_user_preferences_to_default(target_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  default_price text[] := ARRAY['$$'];
BEGIN
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
$function$;

CREATE OR REPLACE FUNCTION public.create_test_venues(venues_data jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  venue_record jsonb;
BEGIN
  -- This function runs with elevated privileges and can bypass RLS
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
$function$;

-- Update RLS policies to require authentication where appropriate
-- Most of these tables should require authentication for a dating app

-- Update AI compatibility scores policies to require authentication
DROP POLICY IF EXISTS "System can insert compatibility scores" ON public.ai_compatibility_scores;
DROP POLICY IF EXISTS "System can update compatibility scores" ON public.ai_compatibility_scores;
CREATE POLICY "Authenticated system can manage compatibility scores" ON public.ai_compatibility_scores
FOR ALL USING (auth.uid() IS NOT NULL);

-- Update AI date recommendations policies to require authentication  
DROP POLICY IF EXISTS "System can manage recommendations" ON public.ai_date_recommendations;
CREATE POLICY "Authenticated system can manage recommendations" ON public.ai_date_recommendations
FOR ALL USING (auth.uid() IS NOT NULL);

-- Update AI venue scores policies to require authentication
DROP POLICY IF EXISTS "System can manage venue scores" ON public.ai_venue_scores;
CREATE POLICY "Authenticated system can manage venue scores" ON public.ai_venue_scores
FOR ALL USING (auth.uid() IS NOT NULL);

-- Update user preference vectors policies to require authentication
DROP POLICY IF EXISTS "System can manage preference vectors" ON public.user_preference_vectors;
CREATE POLICY "Authenticated system can manage preference vectors" ON public.user_preference_vectors
FOR ALL USING (auth.uid() IS NOT NULL);

-- Keep venues publicly viewable as they are reference data
-- This is appropriate for venue discovery