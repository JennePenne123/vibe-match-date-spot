CREATE OR REPLACE FUNCTION public.get_retention_metrics(days_back integer DEFAULT 90)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  WITH activity AS (
    SELECT user_id AS user_id, created_at FROM onboarding_funnel_events WHERE user_id IS NOT NULL
    UNION ALL
    SELECT sender_id, created_at FROM date_invitations
    UNION ALL
    SELECT initiator_id, created_at FROM date_planning_sessions
    UNION ALL
    SELECT user_id, created_at FROM ai_venue_scores
    UNION ALL
    SELECT user_id, created_at FROM friendships
    UNION ALL
    SELECT user_id, created_at FROM date_feedback
  ),
  activity_days AS (
    SELECT DISTINCT user_id, (created_at AT TIME ZONE 'UTC')::date AS day
    FROM activity
  ),
  cohorts AS (
    SELECT id AS user_id, (created_at AT TIME ZONE 'UTC')::date AS signup_day
    FROM profiles
    WHERE created_at >= now() - make_interval(days => days_back)
  ),
  ua AS (
    SELECT c.user_id, c.signup_day, ad.day, (ad.day - c.signup_day) AS offset_days
    FROM cohorts c
    JOIN activity_days ad ON ad.user_id = c.user_id AND ad.day >= c.signup_day
  ),
  retention AS (
    SELECT
      count(DISTINCT c.user_id) FILTER (WHERE c.signup_day <= current_date - 1) AS base_d1,
      count(DISTINCT c.user_id) FILTER (WHERE c.signup_day <= current_date - 7) AS base_d7,
      count(DISTINCT c.user_id) FILTER (WHERE c.signup_day <= current_date - 30) AS base_d30,
      count(DISTINCT ua.user_id) FILTER (WHERE ua.offset_days >= 1 AND c.signup_day <= current_date - 1) AS ret_d1,
      count(DISTINCT ua.user_id) FILTER (WHERE ua.offset_days >= 7 AND c.signup_day <= current_date - 7) AS ret_d7,
      count(DISTINCT ua.user_id) FILTER (WHERE ua.offset_days >= 30 AND c.signup_day <= current_date - 30) AS ret_d30
    FROM cohorts c
    LEFT JOIN ua ON ua.user_id = c.user_id
  ),
  stickiness AS (
    SELECT
      count(DISTINCT user_id) FILTER (WHERE day = current_date) AS dau,
      count(DISTINCT user_id) FILTER (WHERE day >= current_date - 6) AS wau,
      count(DISTINCT user_id) FILTER (WHERE day >= current_date - 29) AS mau
    FROM activity_days
  ),
  gaps AS (
    SELECT user_id, day,
      day - lag(day) OVER (PARTITION BY user_id ORDER BY day) AS gap
    FROM activity_days
  ),
  reactivated AS (
    SELECT count(DISTINCT user_id) AS reactivated_count
    FROM gaps
    WHERE gap >= 14 AND day >= current_date - 30
  ),
  daily AS (
    SELECT day, count(DISTINCT user_id) AS active
    FROM activity_days
    WHERE day >= current_date - days_back
    GROUP BY day
  ),
  weekly_cohorts AS (
    SELECT date_trunc('week', c.signup_day)::date AS cohort_week,
      count(DISTINCT c.user_id) AS size,
      count(DISTINCT ua.user_id) FILTER (WHERE ua.offset_days >= 1) AS d1,
      count(DISTINCT ua.user_id) FILTER (WHERE ua.offset_days >= 7) AS d7,
      count(DISTINCT ua.user_id) FILTER (WHERE ua.offset_days >= 30) AS d30
    FROM cohorts c
    LEFT JOIN ua ON ua.user_id = c.user_id
    GROUP BY 1
  )
  SELECT jsonb_build_object(
    'retention', (SELECT jsonb_build_object(
        'd1_rate', CASE WHEN base_d1 > 0 THEN round(ret_d1::numeric / base_d1 * 100, 1) ELSE 0 END,
        'd7_rate', CASE WHEN base_d7 > 0 THEN round(ret_d7::numeric / base_d7 * 100, 1) ELSE 0 END,
        'd30_rate', CASE WHEN base_d30 > 0 THEN round(ret_d30::numeric / base_d30 * 100, 1) ELSE 0 END,
        'base_d1', base_d1, 'base_d7', base_d7, 'base_d30', base_d30,
        'ret_d1', ret_d1, 'ret_d7', ret_d7, 'ret_d30', ret_d30
      ) FROM retention),
    'stickiness', (SELECT jsonb_build_object(
        'dau', dau, 'wau', wau, 'mau', mau,
        'dau_mau', CASE WHEN mau > 0 THEN round(dau::numeric / mau * 100, 1) ELSE 0 END
      ) FROM stickiness),
    'reactivated', (SELECT reactivated_count FROM reactivated),
    'daily', COALESCE((SELECT jsonb_agg(jsonb_build_object('day', day, 'active', active) ORDER BY day) FROM daily), '[]'::jsonb),
    'cohorts', COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'week', cohort_week, 'size', size,
        'd1', CASE WHEN size > 0 THEN round(d1::numeric / size * 100, 1) ELSE 0 END,
        'd7', CASE WHEN size > 0 THEN round(d7::numeric / size * 100, 1) ELSE 0 END,
        'd30', CASE WHEN size > 0 THEN round(d30::numeric / size * 100, 1) ELSE 0 END
      ) ORDER BY cohort_week) FROM weekly_cohorts), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_retention_metrics(integer) TO authenticated;