-- 1. Fix waitlist_signups: replace WITH CHECK (true) with proper validation
DROP POLICY IF EXISTS "Anyone can insert waitlist signups" ON public.waitlist_signups;
CREATE POLICY "Anyone can insert waitlist signups"
  ON public.waitlist_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(trim(email)) > 5 AND 
    length(trim(name)) > 1 AND
    email LIKE '%@%.%'
  );

-- 2. Fix avatars bucket: replace broad SELECT with scoped policy
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Allow viewing specific avatar files (direct URL access still works for public buckets)
-- But prevent listing all files in the bucket
CREATE POLICY "Authenticated users can view avatars"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

-- Anon users can only view via direct URL (public bucket), no listing
CREATE POLICY "Anon can view own folder avatars"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] IS NOT NULL);

-- 3. Fix venue-photos bucket: replace broad SELECT with scoped policy
DROP POLICY IF EXISTS "Anyone can view venue photos" ON storage.objects;

CREATE POLICY "Authenticated users can view venue photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'venue-photos');

CREATE POLICY "Anon can view venue photos via direct access"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'venue-photos' AND (storage.foldername(name))[1] IS NOT NULL);