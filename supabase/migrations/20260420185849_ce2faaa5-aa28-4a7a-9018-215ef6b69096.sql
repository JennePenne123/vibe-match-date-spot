-- Cache for tiered venue search (Google Places → Foursquare → OSM)
-- Supports both Nearby Search results (3 days) and Venue Details (7 days)

CREATE TABLE IF NOT EXISTS public.venue_search_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text NOT NULL UNIQUE,
  cache_type text NOT NULL CHECK (cache_type IN ('search', 'details')),
  source text NOT NULL CHECK (source IN ('google_places', 'foursquare', 'overpass')),
  payload jsonb NOT NULL,
  result_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  hit_count integer NOT NULL DEFAULT 0,
  last_hit_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_venue_search_cache_key ON public.venue_search_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_venue_search_cache_expires ON public.venue_search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_venue_search_cache_type_source ON public.venue_search_cache(cache_type, source);

ALTER TABLE public.venue_search_cache ENABLE ROW LEVEL SECURITY;

-- Only admins can read/manage the cache directly; edge functions use service role
CREATE POLICY "Admins can view venue search cache"
ON public.venue_search_cache
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete venue search cache"
ON public.venue_search_cache
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Cleanup function: removes expired entries (callable from cron)
CREATE OR REPLACE FUNCTION public.cleanup_venue_search_cache()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.venue_search_cache
  WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;