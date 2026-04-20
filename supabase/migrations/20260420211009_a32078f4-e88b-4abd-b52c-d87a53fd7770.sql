-- Security Definer Function to expose cron job status to admins
CREATE OR REPLACE FUNCTION public.get_cron_jobs_status()
RETURNS TABLE(
  jobid bigint,
  jobname text,
  schedule text,
  active boolean,
  last_run_start timestamp with time zone,
  last_run_end timestamp with time zone,
  last_run_status text,
  last_run_message text,
  total_runs_24h bigint,
  failed_runs_24h bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, cron
AS $$
BEGIN
  -- Only admins can view cron status
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;

  RETURN QUERY
  WITH last_runs AS (
    SELECT DISTINCT ON (d.jobid)
      d.jobid,
      d.start_time,
      d.end_time,
      d.status,
      d.return_message
    FROM cron.job_run_details d
    ORDER BY d.jobid, d.start_time DESC
  ),
  run_stats AS (
    SELECT
      d.jobid,
      COUNT(*) AS total_24h,
      COUNT(*) FILTER (WHERE d.status = 'failed') AS failed_24h
    FROM cron.job_run_details d
    WHERE d.start_time > NOW() - INTERVAL '24 hours'
    GROUP BY d.jobid
  )
  SELECT
    j.jobid,
    j.jobname::text,
    j.schedule::text,
    j.active,
    lr.start_time,
    lr.end_time,
    lr.status::text,
    lr.return_message::text,
    COALESCE(rs.total_24h, 0),
    COALESCE(rs.failed_24h, 0)
  FROM cron.job j
  LEFT JOIN last_runs lr ON lr.jobid = j.jobid
  LEFT JOIN run_stats rs ON rs.jobid = j.jobid
  ORDER BY j.jobname;
END;
$$;

REVOKE ALL ON FUNCTION public.get_cron_jobs_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cron_jobs_status() TO authenticated;