CREATE OR REPLACE FUNCTION public.get_venue_density_metrics(_city text DEFAULT 'Hamburg')
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result jsonb;
BEGIN
  IF NOT public.verify_admin_access() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  WITH v AS (
    SELECT
      id,
      substring(address from '\d{5}') AS plz,
      COALESCE(photos IS NOT NULL AND jsonb_array_length(COALESCE(photos, '[]'::jsonb)) > 0, false) AS has_photo,
      COALESCE(verified, false) AS is_verified,
      CASE
        WHEN tags && ARRAY['museum','theatre','cinema','gallery','art','culture','theater','kino'] THEN 'kultur'
        WHEN tags && ARRAY['nightclub','bar','pub','club','nightlife','cocktail'] THEN 'nightlife'
        WHEN tags && ARRAY['bowling','mini_golf','escape_game','climbing','sports_centre','activity','karaoke','billiards','trampoline','laser_tag'] THEN 'aktivitaet'
        WHEN cuisine_type IS NOT NULL OR tags && ARRAY['restaurant','cafe','food','fast_food','ice_cream'] THEN 'essen'
        ELSE 'sonstige'
      END AS cat
    FROM public.venues
    WHERE is_active AND address ILIKE '%' || COALESCE(_city, 'Hamburg') || '%'
  ),
  by_cat AS (
    SELECT cat, count(*) AS total,
           count(*) FILTER (WHERE has_photo) AS with_photo,
           count(*) FILTER (WHERE is_verified) AS verified
    FROM v GROUP BY cat
  ),
  by_plz AS (
    SELECT plz,
           count(*) AS total,
           count(*) FILTER (WHERE cat = 'essen') AS essen,
           count(*) FILTER (WHERE cat = 'kultur') AS kultur,
           count(*) FILTER (WHERE cat = 'aktivitaet') AS aktivitaet,
           count(*) FILTER (WHERE cat = 'nightlife') AS nightlife,
           count(*) FILTER (WHERE has_photo) AS with_photo
    FROM v
    WHERE plz IS NOT NULL
    GROUP BY plz
    ORDER BY count(*) DESC
    LIMIT 25
  )
  SELECT jsonb_build_object(
    'city', COALESCE(_city, 'Hamburg'),
    'total', (SELECT count(*) FROM v),
    'with_photo', (SELECT count(*) FROM v WHERE has_photo),
    'verified', (SELECT count(*) FROM v WHERE is_verified),
    'targets', jsonb_build_object('essen', 15, 'kultur', 8, 'aktivitaet', 8, 'nightlife', 8),
    'categories', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'category', cat, 'total', total, 'with_photo', with_photo, 'verified', verified
      ) ORDER BY total DESC) FROM by_cat), '[]'::jsonb),
    'districts', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'plz', plz, 'total', total, 'essen', essen, 'kultur', kultur,
        'aktivitaet', aktivitaet, 'nightlife', nightlife, 'with_photo', with_photo
      ) ORDER BY total DESC) FROM by_plz), '[]'::jsonb)
  ) INTO _result;

  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_venue_density_metrics(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_venue_density_metrics(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_venue_density_metrics(text) TO authenticated;