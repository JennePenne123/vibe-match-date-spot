CREATE OR REPLACE FUNCTION public.get_signal_activation_metrics(days_back integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _window interval := make_interval(days => GREATEST(COALESCE(days_back, 30), 1));
  _threshold constant integer := 5;
  _solo_return_days constant integer := 14;
  _group_return_days constant integer := 45;
  _result jsonb;
BEGIN
  IF NOT public.verify_admin_access() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  WITH signals AS (
    SELECT user_id, created_at FROM public.user_venue_feedback
    UNION ALL
    SELECT user_id, created_at FROM public.date_feedback
    UNION ALL
    SELECT user_id, created_at FROM public.ai_learning_data WHERE actual_rating IS NOT NULL
  ),
  -- Users who ever planned with someone else (duo or group)
  social_users AS (
    SELECT initiator_id AS user_id FROM public.date_planning_sessions WHERE COALESCE(planning_mode, 'solo') <> 'solo'
    UNION
    SELECT partner_id FROM public.date_planning_sessions WHERE partner_id IS NOT NULL AND COALESCE(planning_mode, 'solo') <> 'solo'
    UNION
    SELECT user_id FROM public.date_group_members
    UNION
    SELECT creator_id FROM public.date_groups
    UNION
    SELECT sender_id FROM public.date_invitations
    UNION
    SELECT recipient_id FROM public.date_invitations
  ),
  cohort AS (
    SELECT p.id AS user_id,
           p.created_at,
           CASE WHEN EXISTS (SELECT 1 FROM social_users s WHERE s.user_id = p.id)
                THEN 'duo_group' ELSE 'solo' END AS segment
    FROM public.profiles p
    WHERE p.created_at <= now() - _window
  ),
  cohort_counts AS (
    SELECT c.user_id,
           c.segment,
           date_trunc('week', c.created_at) AS signup_week,
           (SELECT count(*) FROM signals s
             WHERE s.user_id = c.user_id
               AND s.created_at >= c.created_at
               AND s.created_at < c.created_at + _window) AS signal_count,
           EXISTS (
             SELECT 1 FROM signals s
             WHERE s.user_id = c.user_id
               AND s.created_at >= now() - make_interval(days =>
                     CASE WHEN c.segment = 'solo' THEN _solo_return_days ELSE _group_return_days END)
           ) AS returned
    FROM cohort c
  ),
  rolling AS (
    SELECT s.user_id, count(*) AS signal_count
    FROM signals s
    WHERE s.created_at >= now() - _window
    GROUP BY s.user_id
  ),
  weekly AS (
    SELECT signup_week,
           count(*) AS cohort_size,
           count(*) FILTER (WHERE signal_count >= _threshold) AS activated
    FROM cohort_counts
    GROUP BY signup_week
    ORDER BY signup_week
  ),
  segments AS (
    SELECT segment,
           count(*) AS cohort_size,
           count(*) FILTER (WHERE signal_count >= _threshold) AS activated,
           round(100.0 * count(*) FILTER (WHERE signal_count >= _threshold) / NULLIF(count(*), 0), 1) AS rate,
           round(avg(signal_count), 2) AS avg_signals,
           count(*) FILTER (WHERE returned) AS returned,
           round(100.0 * count(*) FILTER (WHERE returned) / NULLIF(count(*), 0), 1) AS return_rate,
           CASE WHEN segment = 'solo' THEN _solo_return_days ELSE _group_return_days END AS return_window_days
    FROM cohort_counts
    GROUP BY segment
  )
  SELECT jsonb_build_object(
    'threshold', _threshold,
    'window_days', GREATEST(COALESCE(days_back, 30), 1),
    'cohort_size', (SELECT count(*) FROM cohort_counts),
    'activated', (SELECT count(*) FROM cohort_counts WHERE signal_count >= _threshold),
    'activation_rate', COALESCE((
      SELECT round(100.0 * count(*) FILTER (WHERE signal_count >= _threshold) / NULLIF(count(*), 0), 1)
      FROM cohort_counts), 0),
    'avg_signals', COALESCE((SELECT round(avg(signal_count), 2) FROM cohort_counts), 0),
    'median_signals', COALESCE((
      SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY signal_count) FROM cohort_counts), 0),
    'distribution', jsonb_build_array(
      jsonb_build_object('bucket', '0', 'users', (SELECT count(*) FROM cohort_counts WHERE signal_count = 0)),
      jsonb_build_object('bucket', '1-2', 'users', (SELECT count(*) FROM cohort_counts WHERE signal_count BETWEEN 1 AND 2)),
      jsonb_build_object('bucket', '3-4', 'users', (SELECT count(*) FROM cohort_counts WHERE signal_count BETWEEN 3 AND 4)),
      jsonb_build_object('bucket', '5+', 'users', (SELECT count(*) FROM cohort_counts WHERE signal_count >= _threshold))
    ),
    'segments', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'segment', segment,
        'cohort_size', cohort_size,
        'activated', activated,
        'rate', COALESCE(rate, 0),
        'avg_signals', COALESCE(avg_signals, 0),
        'returned', returned,
        'return_rate', COALESCE(return_rate, 0),
        'return_window_days', return_window_days
      ) ORDER BY segment)
      FROM segments), '[]'::jsonb),
    'rolling', jsonb_build_object(
      'users_with_signals', (SELECT count(*) FROM rolling),
      'users_activated', (SELECT count(*) FROM rolling WHERE signal_count >= _threshold),
      'total_signals', COALESCE((SELECT sum(signal_count) FROM rolling), 0)
    ),
    'weekly', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'week', signup_week,
        'cohort_size', cohort_size,
        'activated', activated,
        'rate', round(100.0 * activated / NULLIF(cohort_size, 0), 1)
      ) ORDER BY signup_week)
      FROM weekly), '[]'::jsonb),
    'pending_cohort', (SELECT count(*) FROM public.profiles WHERE created_at > now() - _window)
  ) INTO _result;

  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_signal_activation_metrics(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_signal_activation_metrics(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_signal_activation_metrics(integer) TO authenticated;