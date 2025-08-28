-- Create security definer function for test venue creation
CREATE OR REPLACE FUNCTION public.create_test_venues(venues_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;