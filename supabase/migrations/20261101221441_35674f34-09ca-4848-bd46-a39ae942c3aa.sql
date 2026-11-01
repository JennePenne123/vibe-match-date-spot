-- Candidate picker for the Wikimedia photo backfill: excludes venues still inside
-- their cooldown window server-side, so each run gets fresh venues instead of the
-- same over-fetched set every hour.
CREATE OR REPLACE FUNCTION public.get_wikimedia_photo_candidates(
  p_limit integer DEFAULT 80,
  p_cuisine_types text[] DEFAULT NULL
)
RETURNS TABLE (id text, name text, latitude numeric, longitude numeric, photos jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT v.id, v.name, v.latitude, v.longitude, v.photos
  FROM public.venues v
  WHERE v.is_active = true
    AND v.google_place_id IS NULL
    AND v.latitude IS NOT NULL
    AND v.longitude IS NOT NULL
    AND (v.photos IS NULL OR v.photos = '[]'::jsonb OR v.photos = '"[]"'::jsonb)
    AND (p_cuisine_types IS NULL OR cardinality(p_cuisine_types) = 0 OR v.cuisine_type = ANY (p_cuisine_types))
    AND NOT EXISTS (
      SELECT 1 FROM public.venue_photo_attempts a
      WHERE a.venue_id = v.id
        AND a.source = 'wikimedia'
        AND a.next_retry_at > now()
    )
  ORDER BY v.id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 80), 1), 200);
$$;

REVOKE ALL ON FUNCTION public.get_wikimedia_photo_candidates(integer, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_wikimedia_photo_candidates(integer, text[]) TO service_role;