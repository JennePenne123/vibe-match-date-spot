CREATE TABLE IF NOT EXISTS public.venue_import_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  job_id uuid,
  city text,
  country text,
  category text,
  tag_key text,
  tag_value text,
  dedupe_key text,
  venue_id text,
  duplicate_of text,
  message text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT venue_import_audit_severity_check CHECK (severity IN ('info','warn','error'))
);

GRANT SELECT ON public.venue_import_audit TO authenticated;
GRANT ALL ON public.venue_import_audit TO service_role;

ALTER TABLE public.venue_import_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view import audit"
  ON public.venue_import_audit FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_venue_import_audit_created
  ON public.venue_import_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_venue_import_audit_type_created
  ON public.venue_import_audit (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_venue_import_audit_dedupe_key
  ON public.venue_import_audit (dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_venue_import_audit_city_category
  ON public.venue_import_audit (city, category, created_at DESC);

-- Zusammenführung protokolliert ab sofort jede Dublette
CREATE OR REPLACE FUNCTION public.merge_duplicate_venues()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  grp record;
  keeper public.venues%ROWTYPE;
  dup public.venues%ROWTYPE;
  merged_groups int := 0;
  deactivated int := 0;
BEGIN
  FOR grp IN
    SELECT dedupe_key
    FROM public.venues
    WHERE dedupe_key IS NOT NULL AND is_active = true
    GROUP BY dedupe_key
    HAVING count(*) > 1
  LOOP
    SELECT * INTO keeper
    FROM public.venues
    WHERE dedupe_key = grp.dedupe_key AND is_active = true
    ORDER BY
      (source = 'openstreetmap')::int ASC,
      ((address IS NOT NULL AND address <> '')::int
        + (phone IS NOT NULL AND phone <> '')::int
        + (website IS NOT NULL AND website <> '')::int
        + (image_url IS NOT NULL)::int
        + (photos IS NOT NULL)::int
        + (rating IS NOT NULL)::int) DESC,
      created_at ASC
    LIMIT 1;

    FOR dup IN
      SELECT * FROM public.venues
      WHERE dedupe_key = grp.dedupe_key AND is_active = true AND id <> keeper.id
    LOOP
      UPDATE public.venues
      SET google_place_id = NULL, foursquare_id = NULL
      WHERE id = dup.id;

      UPDATE public.venues SET
        address = CASE WHEN coalesce(address, '') = '' THEN dup.address ELSE address END,
        phone = CASE WHEN coalesce(phone, '') = '' THEN dup.phone ELSE phone END,
        website = CASE WHEN coalesce(website, '') = '' THEN dup.website ELSE website END,
        description = CASE WHEN coalesce(description, '') = '' THEN dup.description ELSE description END,
        image_url = coalesce(image_url, dup.image_url),
        photos = coalesce(photos, dup.photos),
        rating = coalesce(rating, dup.rating),
        price_range = coalesce(price_range, dup.price_range),
        cuisine_type = coalesce(cuisine_type, dup.cuisine_type),
        opening_hours = coalesce(opening_hours, dup.opening_hours),
        google_place_id = coalesce(google_place_id, dup.google_place_id),
        foursquare_id = coalesce(foursquare_id, dup.foursquare_id),
        tags = CASE WHEN tags IS NULL THEN dup.tags
                    WHEN dup.tags IS NULL THEN tags
                    ELSE (SELECT array_agg(DISTINCT x) FROM unnest(tags || dup.tags) AS x) END,
        updated_at = now()
      WHERE id = keeper.id;

      UPDATE public.venues
      SET is_active = false, updated_at = now()
      WHERE id = dup.id;

      INSERT INTO public.venue_import_audit
        (event_type, severity, dedupe_key, venue_id, duplicate_of, message, details)
      VALUES (
        'duplicate_merged', 'info', grp.dedupe_key, keeper.id, dup.id,
        format('%s zusammengeführt mit %s', dup.name, keeper.name),
        jsonb_build_object(
          'duplicate_name', dup.name, 'keeper_name', keeper.name,
          'duplicate_source', dup.source, 'keeper_source', keeper.source,
          'latitude', dup.latitude, 'longitude', dup.longitude
        )
      );

      deactivated := deactivated + 1;
    END LOOP;

    merged_groups := merged_groups + 1;
  END LOOP;

  RETURN jsonb_build_object('merged_groups', merged_groups, 'deactivated', deactivated);
END;
$function$;

-- Fehlerübersicht für den Admin-Bereich
CREATE OR REPLACE FUNCTION public.get_import_audit_summary(days_back integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cutoff timestamptz := now() - make_interval(days => greatest(days_back, 1));
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  SELECT jsonb_build_object(
    'window_days', greatest(days_back, 1),
    'totals', (
      SELECT coalesce(jsonb_object_agg(event_type, c), '{}'::jsonb)
      FROM (SELECT event_type, count(*) c FROM public.venue_import_audit
            WHERE created_at >= cutoff GROUP BY event_type) t
    ),
    'by_severity', (
      SELECT coalesce(jsonb_object_agg(severity, c), '{}'::jsonb)
      FROM (SELECT severity, count(*) c FROM public.venue_import_audit
            WHERE created_at >= cutoff GROUP BY severity) s
    ),
    'top_failing_tags', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT tag_key, tag_value, count(*) failures,
               count(DISTINCT city) cities, max(created_at) last_seen
        FROM public.venue_import_audit
        WHERE created_at >= cutoff AND severity <> 'info' AND tag_key IS NOT NULL
        GROUP BY tag_key, tag_value ORDER BY count(*) DESC LIMIT 15
      ) x
    ),
    'top_failing_cities', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT city, category, count(*) failures, max(created_at) last_seen
        FROM public.venue_import_audit
        WHERE created_at >= cutoff AND severity <> 'info' AND city IS NOT NULL
        GROUP BY city, category ORDER BY count(*) DESC LIMIT 15
      ) x
    ),
    'recent', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT event_type, severity, city, category, tag_key, tag_value,
               dedupe_key, message, created_at
        FROM public.venue_import_audit
        WHERE created_at >= cutoff
        ORDER BY created_at DESC LIMIT 50
      ) x
    )
  ) INTO result;

  RETURN result;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_import_audit_summary(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_import_audit_summary(integer) TO authenticated;

-- Verdächtige Dubletten, die der exakte Schlüssel (noch) nicht erfasst
CREATE OR REPLACE FUNCTION public.get_duplicate_candidates(_limit integer DEFAULT 50)
RETURNS TABLE(
  normalized_name text, latitude numeric, longitude numeric,
  venue_count bigint, venue_ids text[], venue_names text[], cities text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  RETURN QUERY
  SELECT lower(regexp_replace(translate(v.name, 'äöüÄÖÜß', 'aouAOUs'), '[^a-zA-Z0-9]', '', 'g')) AS normalized_name,
         round(v.latitude, 3) AS latitude,
         round(v.longitude, 3) AS longitude,
         count(*) AS venue_count,
         array_agg(v.id) AS venue_ids,
         array_agg(v.name) AS venue_names,
         array_agg(DISTINCT coalesce(v.address, '')) AS cities
  FROM public.venues v
  WHERE v.is_active = true AND v.latitude IS NOT NULL AND v.longitude IS NOT NULL
  GROUP BY 1, 2, 3
  HAVING count(*) > 1
  ORDER BY count(*) DESC
  LIMIT greatest(_limit, 1);
END;
$function$;

REVOKE ALL ON FUNCTION public.get_duplicate_candidates(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_duplicate_candidates(integer) TO authenticated;