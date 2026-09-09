CREATE OR REPLACE FUNCTION public.get_visit_verification_metrics(days_back integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  since timestamptz := now() - (days_back || ' days')::interval;
  result jsonb;
BEGIN
  IF NOT public.verify_admin_access() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT jsonb_build_object(
    'days_back', days_back,
    'visits_total', (SELECT count(*) FROM venue_visits WHERE created_at >= since),
    'visits_verified', (SELECT count(*) FROM venue_visits WHERE created_at >= since AND verified),
    'visits_manual', (SELECT count(*) FROM venue_visits WHERE created_at >= since AND verification_method = 'manual'),
    'visits_auto', (SELECT count(*) FROM venue_visits WHERE created_at >= since AND verification_method = 'auto'),
    'visits_open', (SELECT count(*) FROM venue_visits WHERE created_at >= since AND left_at IS NULL),
    'median_distance_m', (
      SELECT round(percentile_cont(0.5) WITHIN GROUP (ORDER BY closest_distance_m)::numeric, 0)
      FROM venue_visits WHERE created_at >= since AND closest_distance_m IS NOT NULL
    ),
    'p90_distance_m', (
      SELECT round(percentile_cont(0.9) WITHIN GROUP (ORDER BY closest_distance_m)::numeric, 0)
      FROM venue_visits WHERE created_at >= since AND closest_distance_m IS NOT NULL
    ),
    'distance_buckets', (
      SELECT coalesce(jsonb_agg(jsonb_build_object('bucket', b.bucket, 'count', b.cnt) ORDER BY b.ord), '[]'::jsonb)
      FROM (
        SELECT
          CASE
            WHEN closest_distance_m <= 25 THEN '0–25 m'
            WHEN closest_distance_m <= 50 THEN '26–50 m'
            WHEN closest_distance_m <= 100 THEN '51–100 m'
            WHEN closest_distance_m <= 200 THEN '101–200 m'
            ELSE '> 200 m'
          END AS bucket,
          CASE
            WHEN closest_distance_m <= 25 THEN 1
            WHEN closest_distance_m <= 50 THEN 2
            WHEN closest_distance_m <= 100 THEN 3
            WHEN closest_distance_m <= 200 THEN 4
            ELSE 5
          END AS ord,
          count(*) AS cnt
        FROM venue_visits
        WHERE created_at >= since AND closest_distance_m IS NOT NULL
        GROUP BY 1, 2
      ) b
    ),
    'median_stay_minutes', (
      SELECT round(percentile_cont(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM (left_at - arrived_at)) / 60
      )::numeric, 0)
      FROM venue_visits WHERE created_at >= since AND left_at IS NOT NULL
    ),
    'short_stays', (
      SELECT count(*) FROM venue_visits
      WHERE created_at >= since AND left_at IS NOT NULL
        AND EXTRACT(EPOCH FROM (left_at - arrived_at)) / 60 < 15
    ),
    'feedback_total', (SELECT count(*) FROM date_feedback WHERE created_at >= since),
    'feedback_verified', (SELECT count(*) FROM date_feedback WHERE created_at >= since AND visit_verified)
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_visit_verification_metrics(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_visit_verification_metrics(integer) TO authenticated;