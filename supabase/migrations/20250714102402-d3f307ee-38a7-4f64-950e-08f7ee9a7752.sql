-- Fix RLS policy for user_preferences table
DROP POLICY IF EXISTS "Users can create their own preferences" ON public.user_preferences;

CREATE POLICY "Users can create their own preferences" 
ON public.user_preferences 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Create a system function for test data setup that can bypass RLS
CREATE OR REPLACE FUNCTION public.setup_test_user_preferences(
  target_user_id uuid,
  cuisines text[] DEFAULT NULL,
  vibes text[] DEFAULT NULL,
  times text[] DEFAULT NULL,
  price_range text[] DEFAULT NULL,
  max_dist integer DEFAULT NULL,
  dietary text[] DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Create a function to reset user preferences to defaults
CREATE OR REPLACE FUNCTION public.reset_user_preferences_to_default(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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