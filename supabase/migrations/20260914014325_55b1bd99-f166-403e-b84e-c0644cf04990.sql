ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS dedupe_key text;

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
         ) || '@' || round(_lat, 4)::text || ',' || round(_lon, 4)::text
  END
$$;

CREATE OR REPLACE FUNCTION public.set_venue_dedupe_key()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.dedupe_key := public.venue_dedupe_key(NEW.name, NEW.latitude, NEW.longitude);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS venues_set_dedupe_key ON public.venues;
CREATE TRIGGER venues_set_dedupe_key
BEFORE INSERT OR UPDATE OF name, latitude, longitude ON public.venues
FOR EACH ROW EXECUTE FUNCTION public.set_venue_dedupe_key();

UPDATE public.venues
SET dedupe_key = public.venue_dedupe_key(name, latitude, longitude)
WHERE dedupe_key IS DISTINCT FROM public.venue_dedupe_key(name, latitude, longitude);

CREATE INDEX IF NOT EXISTS venues_dedupe_key_idx ON public.venues (dedupe_key) WHERE dedupe_key IS NOT NULL;

CREATE OR REPLACE FUNCTION public.merge_duplicate_venues()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      -- Eindeutige Fremd-IDs zuerst beim Duplikat freigeben, damit sie
      -- konfliktfrei auf den Haupteintrag übertragen werden können.
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

      deactivated := deactivated + 1;
    END LOOP;

    merged_groups := merged_groups + 1;
  END LOOP;

  RETURN jsonb_build_object('merged_groups', merged_groups, 'deactivated', deactivated);
END;
$$;

REVOKE ALL ON FUNCTION public.merge_duplicate_venues() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.merge_duplicate_venues() TO service_role;

SELECT public.merge_duplicate_venues();