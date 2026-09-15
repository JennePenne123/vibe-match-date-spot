CREATE OR REPLACE FUNCTION public.get_venue_density_metrics(
  _city text DEFAULT 'Hamburg'::text,
  _min_lat numeric DEFAULT NULL,
  _max_lat numeric DEFAULT NULL,
  _min_lon numeric DEFAULT NULL,
  _max_lon numeric DEFAULT NULL
)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _result jsonb;
  _use_bbox boolean := _min_lat IS NOT NULL AND _max_lat IS NOT NULL
                       AND _min_lon IS NOT NULL AND _max_lon IS NOT NULL;
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
    WHERE is_active
      AND (
        CASE WHEN _use_bbox
          THEN latitude BETWEEN _min_lat AND _max_lat
               AND longitude BETWEEN _min_lon AND _max_lon
          ELSE address ILIKE '%' || COALESCE(_city, 'Hamburg') || '%'
        END
      )
  ),
  v AS (
    SELECT
      id, plz, has_photo, is_verified,
      CASE
        WHEN ct IN ('spa & wellness','spa','sauna','thermal bath','therme','yoga','massage','wellness','public bath','swimming') THEN 'wellness'
        WHEN ct IN ('nature spot','park','garden','beach','beach resort','viewpoint','nature reserve','marina','picnic site','common') THEN 'outdoor'
        WHEN ct IN ('sport & action','go-kart','paintball','laser tag','trampoline park','adventure park','climbing','bowling','billiards','pub sport','ice rink','horse riding','watersport','arcade','escape room','mini golf') THEN 'sport_action'
        WHEN ct IN ('museum','theater','theatre','cinema','kino','gallery','art gallery','arts centre','arts center','library','attraction','aquarium','zoo','planetarium','exhibition','monument','castle','memorial') THEN 'kultur'
        WHEN ct IN ('bar','pub','nightclub','club','biergarten','beer garden','cocktail bar','casino','karaoke','wine bar','shisha') THEN 'nightlife'
        WHEN ct IN ('minigolf','sport','fitness','sports centre','swimming pool') THEN 'aktivitaet'
        WHEN tg && ARRAY['restaurant','cafe','café','food','fast-food-restaurant','food-beverage','bakery','ice_cream','dining']
             OR EXISTS (SELECT 1 FROM unnest(tg) x WHERE x LIKE '%-restaurant' OR x LIKE '%restaurant%') THEN 'essen'
        WHEN tg && ARRAY['spa','sauna','wellness','therme','thermal_bath','yoga','massage','relaxing','pilates'] THEN 'wellness'
        WHEN tg && ARRAY['park','garden','beach','strand','viewpoint','nature_reserve','nature','outdoor','picnic','marina','hiking','walk'] THEN 'outdoor'
        WHEN tg && ARRAY['kart','go-kart','paintball','lasertag','laser_tag','bouldering','climbing','trampoline','bowling','billiards','escape room','escape_game','minigolf','mini_golf','archery','skateboard','ice skating','adventure park'] THEN 'sport_action'
        WHEN tg && ARRAY['museum','theatre','theater','cinema','kino','gallery','art-gallery','art','kunst','cultural','arts-entertainment','entertainment','library','exhibition','monument','culture'] THEN 'kultur'
        WHEN tg && ARRAY['nightclub','bar','pub','club','nightlife','cocktail','biergarten','casino','karaoke','drinks'] THEN 'nightlife'
        WHEN tg && ARRAY['sports_centre','sport','fitness','fitness centre','active','activity','swimming'] THEN 'aktivitaet'
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
           count(*) FILTER (WHERE cat = 'wellness') AS wellness,
           count(*) FILTER (WHERE cat = 'outdoor') AS outdoor,
           count(*) FILTER (WHERE cat = 'sport_action') AS sport_action,
           count(*) FILTER (WHERE has_photo) AS with_photo
    FROM v
    WHERE plz IS NOT NULL
    GROUP BY plz
    ORDER BY count(*) DESC
    LIMIT 25
  )
  SELECT jsonb_build_object(
    'city', COALESCE(_city, 'Hamburg'),
    'scope', CASE WHEN _use_bbox THEN 'bbox' ELSE 'address' END,
    'total', (SELECT count(*) FROM v),
    'with_photo', (SELECT count(*) FROM v WHERE has_photo),
    'verified', (SELECT count(*) FROM v WHERE is_verified),
    'targets', jsonb_build_object('essen', 15, 'kultur', 8, 'aktivitaet', 8, 'nightlife', 8, 'wellness', 4, 'outdoor', 5, 'sport_action', 4),
    'categories', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'category', cat, 'total', total, 'with_photo', with_photo, 'verified', verified
      ) ORDER BY total DESC) FROM by_cat), '[]'::jsonb),
    'districts', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'plz', plz, 'total', total, 'essen', essen, 'kultur', kultur,
        'aktivitaet', aktivitaet, 'nightlife', nightlife,
        'wellness', wellness, 'outdoor', outdoor, 'sport_action', sport_action,
        'with_photo', with_photo
      ) ORDER BY total DESC) FROM by_plz), '[]'::jsonb)
  ) INTO _result;

  RETURN _result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_venue_density_metrics(text, numeric, numeric, numeric, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_venue_density_metrics(text, numeric, numeric, numeric, numeric) TO authenticated;