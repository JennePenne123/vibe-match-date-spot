-- Add 'openstreetmap' and 'radar' as trusted sources for venue insertion
DROP POLICY IF EXISTS "System can create venues from trusted sources" ON public.venues;
CREATE POLICY "System can create venues from trusted sources"
ON public.venues
FOR INSERT
TO public
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'venue_partner') OR
    source = ANY (ARRAY['foursquare', 'google_places', 'system', 'openstreetmap', 'radar'])
  )
);

-- Allow update for trusted sources (edge functions updating existing venues)
DROP POLICY IF EXISTS "System can update venues from trusted sources" ON public.venues;
CREATE POLICY "System can update venues from trusted sources"
ON public.venues
FOR UPDATE
TO public
USING (
  source = ANY (ARRAY['foursquare', 'google_places', 'system', 'openstreetmap', 'radar'])
)
WITH CHECK (
  source = ANY (ARRAY['foursquare', 'google_places', 'system', 'openstreetmap', 'radar'])
);