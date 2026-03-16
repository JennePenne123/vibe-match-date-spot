
-- Add menu_highlights column to venues
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS menu_highlights text[] DEFAULT NULL;

-- Create venue-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-photos', 'venue-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Partners can upload photos for their venues
CREATE POLICY "Partners can upload venue photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'venue-photos' AND
  EXISTS (
    SELECT 1 FROM public.venue_partnerships vp
    WHERE vp.partner_id = auth.uid()
      AND vp.status = 'active'
      AND (storage.foldername(name))[1] = vp.venue_id
  )
);

-- RLS: Anyone can view venue photos (public bucket)
CREATE POLICY "Anyone can view venue photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'venue-photos');

-- RLS: Partners can delete their venue photos
CREATE POLICY "Partners can delete venue photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'venue-photos' AND
  EXISTS (
    SELECT 1 FROM public.venue_partnerships vp
    WHERE vp.partner_id = auth.uid()
      AND vp.status = 'active'
      AND (storage.foldername(name))[1] = vp.venue_id
  )
);

-- RLS: Partners can update venues they manage
CREATE POLICY "Partners can update their venues"
ON public.venues FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.venue_partnerships vp
    WHERE vp.venue_id = venues.id
      AND vp.partner_id = auth.uid()
      AND vp.status = 'active'
  )
);
