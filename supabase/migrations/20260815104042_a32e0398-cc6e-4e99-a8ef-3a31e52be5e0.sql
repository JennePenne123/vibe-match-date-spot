CREATE OR REPLACE FUNCTION public.get_venue_density_metrics(_city text DEFAULT 'Hamburg'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _result jsonb;
BEGIN
  IF NOT public.verify_admin_access() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  WITH base AS (
    SELECT
      id,
      substring(address from '\d{5}') AS plz,
      COALESCE(photos IS NOT NULL AND jsonb_array_length(COALESCE(photos, '[]'::jsonb)) > 0, false) AS has_photo,
      COALESCE(verified, false) AS is_verified,
      lower(COALESCE(cuisine_type, '')) AS ct,
      ARRAY(SELECT lower(t) FROM unnest(COALESCE(tags, ARRAY[]::text[])) t) AS tg
    FROM public.venues
    WHERE is_active AND address ILIKE '%' || COALESCE(_city, 'Hamburg') || '%'
  ),
  v AS (
    SELECT
      id, plz, has_photo, is_verified,
      CASE
        WHEN ct IN ('museum','theater','theatre','cinema','kino','gallery','art gallery','arts centre','arts center','library','attraction','aquarium','zoo','planetarium','exhibition','monument','castle','memorial') THEN 'kultur'
        WHEN ct IN ('bar','pub','nightclub','club','biergarten','beer garden','cocktail bar','casino','karaoke','wine bar','shisha') THEN 'nightlife'
        WHEN ct IN ('mini golf','minigolf','arcade','bowling','escape room','climbing','spa','sauna','fitness','sports centre','swimming pool','ice rink','trampoline','laser tag','go kart','paintball','billiards') THEN 'aktivitaet'
        WHEN tg && ARRAY['restaurant','cafe','café','food','fast-food-restaurant','food-beverage','bakery','ice_cream','dining']
             OR EXISTS (SELECT 1 FROM unnest(tg) x WHERE x LIKE '%-restaurant' OR x LIKE '%restaurant%') THEN 'essen'
        WHEN tg && ARRAY['museum','theatre','theater','cinema','kino','gallery','art-gallery','art','kunst','cultural','arts-entertainment','entertainment','library','exhibition','monument','culture'] THEN 'kultur'
        WHEN tg && ARRAY['nightclub','bar','pub','club','nightlife','cocktail','biergarten','casino','karaoke','drinks'] THEN 'nightlife'
        WHEN tg && ARRAY['bowling','mini_golf','minigolf','escape_game','climbing','sports_centre','sport','fitness','fitness centre','active','activity','billiards','trampoline','laser_tag','spa','sauna','swimming'] THEN 'aktivitaet'
        WHEN ct <> '' THEN 'essen'
        ELSE 'sonstige'
      END AS cat
    FROM base
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
$function$;

REVOKE EXECUTE ON FUNCTION public.get_venue_density_metrics(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_venue_density_metrics(text) TO authenticated;