CREATE OR REPLACE FUNCTION public.venue_dedupe_key(_name text, _lat numeric, _lon numeric)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _name IS NULL OR _lat IS NULL OR _lon IS NULL THEN NULL
    ELSE regexp_replace(
           lower(translate(_name, 'äöüßáàâéèêíìîóòôúùûñç', 'aousaaaeeeiiiooouuunc')),
           '[^a-z0-9]', '', 'g'
         ) || '@' || to_char(round(_lat, 4), 'FM999990.0000')
            || ',' || to_char(round(_lon, 4), 'FM999990.0000')
  END
$$;

UPDATE public.venues
SET dedupe_key = public.venue_dedupe_key(name, latitude, longitude)
WHERE dedupe_key IS DISTINCT FROM public.venue_dedupe_key(name, latitude, longitude);

SELECT public.merge_duplicate_venues();