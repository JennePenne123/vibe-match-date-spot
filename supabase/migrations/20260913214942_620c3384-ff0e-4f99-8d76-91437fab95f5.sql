CREATE TABLE public.venue_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  country text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  radius_km integer NOT NULL DEFAULT 15,
  category text NOT NULL,
  priority integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'pending',
  chunk_offset integer NOT NULL DEFAULT 0,
  fetched_count integer NOT NULL DEFAULT 0,
  saved_count integer NOT NULL DEFAULT 0,
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT venue_import_jobs_category_chk CHECK (category IN ('food','culture','activity','nightlife')),
  CONSTRAINT venue_import_jobs_status_chk CHECK (status IN ('pending','running','done','failed')),
  CONSTRAINT venue_import_jobs_unique UNIQUE (city, country, category)
);

GRANT SELECT ON public.venue_import_jobs TO authenticated;
GRANT ALL ON public.venue_import_jobs TO service_role;

ALTER TABLE public.venue_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view import jobs"
ON public.venue_import_jobs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_venue_import_jobs_queue ON public.venue_import_jobs (status, priority, created_at);

CREATE TRIGGER venue_import_jobs_updated_at
BEFORE UPDATE ON public.venue_import_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.venue_import_control (
  id boolean PRIMARY KEY DEFAULT true,
  paused boolean NOT NULL DEFAULT false,
  paused_reason text,
  lease_until timestamptz,
  last_run_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT venue_import_control_singleton CHECK (id)
);

GRANT SELECT ON public.venue_import_control TO authenticated;
GRANT ALL ON public.venue_import_control TO service_role;

ALTER TABLE public.venue_import_control ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view import control"
ON public.venue_import_control FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER venue_import_control_updated_at
BEFORE UPDATE ON public.venue_import_control
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.venue_import_control (id) VALUES (true) ON CONFLICT (id) DO NOTHING;