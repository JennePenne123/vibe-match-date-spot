-- Dedupe lookups always filter on active rows
CREATE INDEX IF NOT EXISTS idx_venues_dedupe_key_active
  ON public.venues (dedupe_key)
  WHERE dedupe_key IS NOT NULL AND is_active = true;

-- Bounding-box counts / density metrics on active venues
CREATE INDEX IF NOT EXISTS idx_venues_active_location
  ON public.venues (latitude, longitude)
  WHERE is_active = true;

-- Import worker filters by source when reconciling OSM rows
CREATE INDEX IF NOT EXISTS idx_venues_source_active
  ON public.venues (source)
  WHERE is_active = true;

-- Requeue scan: failed jobs older than N minutes
CREATE INDEX IF NOT EXISTS idx_venue_import_jobs_status_updated
  ON public.venue_import_jobs (status, updated_at);

ANALYZE public.venues;
ANALYZE public.venue_import_jobs;