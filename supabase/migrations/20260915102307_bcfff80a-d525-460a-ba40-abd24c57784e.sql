-- lovable-cron-fallback-reviewed: 72 runs/day; photos come from the external Google Places API, so no database webhook can replace the timed backfill; WHERE EXISTS guard makes idle runs no-ops.
SELECT cron.schedule(
  'park-photo-backfill-20min',
  '*/20 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://dfjwubatslzblagthbdw.supabase.co/functions/v1/backfill-venue-photos',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-cron-token', (SELECT cron_token FROM public.venue_import_control WHERE id)
    ),
    body := '{"limit":25,"cuisine_types":["Park","Garden","Viewpoint","Picnic Site","Marina","Beach","Nature Spot"]}'::jsonb
  )
  WHERE EXISTS (
    SELECT 1 FROM public.venues v
    WHERE v.is_active = true
      AND v.google_place_id IS NULL
      AND v.latitude IS NOT NULL
      AND v.longitude IS NOT NULL
      AND v.cuisine_type IN ('Park','Garden','Viewpoint','Picnic Site','Marina','Beach','Nature Spot')
  );
  $$
);