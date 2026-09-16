CREATE TABLE IF NOT EXISTS public.venue_photo_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id text NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('google','wikimedia','foursquare')),
  status text NOT NULL CHECK (status IN ('hit','miss','error')),
  photo_count integer NOT NULL DEFAULT 0,
  api_calls integer NOT NULL DEFAULT 0,
  estimated_cost numeric NOT NULL DEFAULT 0,
  message text,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  next_retry_at timestamptz,
  UNIQUE (venue_id, source)
);

GRANT SELECT ON public.venue_photo_attempts TO authenticated;
GRANT ALL ON public.venue_photo_attempts TO service_role;

ALTER TABLE public.venue_photo_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read photo attempts"
ON public.venue_photo_attempts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_venue_photo_attempts_retry
  ON public.venue_photo_attempts (source, next_retry_at);
CREATE INDEX IF NOT EXISTS idx_venue_photo_attempts_attempted
  ON public.venue_photo_attempts (attempted_at DESC);

CREATE OR REPLACE FUNCTION public.get_photo_backfill_metrics(days_back integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  since timestamptz := now() - make_interval(days => GREATEST(COALESCE(days_back, 7), 1));
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'window_days', GREATEST(COALESCE(days_back, 7), 1),
    'by_source', COALESCE((
      SELECT jsonb_agg(row_to_json(s))
      FROM (
        SELECT
          source,
          count(*) AS attempts,
          count(*) FILTER (WHERE status = 'hit') AS hits,
          count(*) FILTER (WHERE status = 'miss') AS misses,
          count(*) FILTER (WHERE status = 'error') AS errors,
          COALESCE(sum(photo_count), 0) AS photos,
          COALESCE(sum(api_calls), 0) AS api_calls,
          ROUND(COALESCE(sum(estimated_cost), 0)::numeric, 4) AS estimated_cost,
          ROUND((count(*) FILTER (WHERE status = 'hit'))::numeric
                / NULLIF(count(*), 0) * 100, 1) AS hit_rate
        FROM public.venue_photo_attempts
        WHERE attempted_at >= since
        GROUP BY source
        ORDER BY source
      ) s
    ), '[]'::jsonb),
    'total_attempts', (SELECT count(*) FROM public.venue_photo_attempts WHERE attempted_at >= since),
    'total_cost', (SELECT ROUND(COALESCE(sum(estimated_cost), 0)::numeric, 4) FROM public.venue_photo_attempts WHERE attempted_at >= since),
    'cached_venues', (SELECT count(*) FROM public.venue_photo_attempts),
    'cooldown_active', (SELECT count(*) FROM public.venue_photo_attempts WHERE next_retry_at > now()),
    'recent_errors', COALESCE((
      SELECT jsonb_agg(row_to_json(e))
      FROM (
        SELECT venue_id, source, message, attempted_at
        FROM public.venue_photo_attempts
        WHERE status = 'error' AND attempted_at >= since
        ORDER BY attempted_at DESC
        LIMIT 10
      ) e
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_photo_backfill_metrics(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_photo_backfill_metrics(integer) TO authenticated;