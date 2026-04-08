
-- Drop and recreate profiles_safe without email and without security_invoker
DROP VIEW IF EXISTS public.profiles_safe;

CREATE VIEW public.profiles_safe AS
SELECT
  id,
  name,
  avatar_url,
  created_at,
  updated_at
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.profiles_safe TO anon;

-- =============================================
-- FIX 2: Venue-photos - scope to partner's own venues
-- =============================================

DROP POLICY IF EXISTS "Partners can upload venue photos" ON storage.objects;
DROP POLICY IF EXISTS "Partners can update venue photos" ON storage.objects;
DROP POLICY IF EXISTS "Partners can delete venue photos" ON storage.objects;

CREATE POLICY "Partners can upload venue photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'venue-photos'
  AND EXISTS (
    SELECT 1 FROM public.venue_partnerships
    WHERE partner_id = auth.uid()
    AND status = 'approved'
    AND venue_id = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Partners can update venue photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'venue-photos'
  AND EXISTS (
    SELECT 1 FROM public.venue_partnerships
    WHERE partner_id = auth.uid()
    AND status = 'approved'
    AND venue_id = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Partners can delete venue photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'venue-photos'
  AND EXISTS (
    SELECT 1 FROM public.venue_partnerships
    WHERE partner_id = auth.uid()
    AND status = 'approved'
    AND venue_id = (storage.foldername(name))[1]
  )
);
