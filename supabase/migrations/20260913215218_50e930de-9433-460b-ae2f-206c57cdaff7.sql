ALTER TABLE public.venue_import_control
  ADD COLUMN IF NOT EXISTS cron_token text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex');

REVOKE SELECT ON public.venue_import_control FROM authenticated;
GRANT SELECT (id, paused, paused_reason, lease_until, last_run_at, updated_at) ON public.venue_import_control TO authenticated;