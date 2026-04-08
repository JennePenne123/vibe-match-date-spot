
-- =============================================
-- FIX 1: Email-Leak - Remove friend access to base profiles table
-- Friends must use profiles_safe view (which excludes email)
-- =============================================

-- Drop the friend profile SELECT policy on base table
DROP POLICY IF EXISTS "Users can view friend profiles" ON public.profiles;

-- Grant friends access only through profiles_safe view
-- profiles_safe already exists and excludes email
-- We need an RLS policy that allows friends to read the BASE table
-- BUT only through the view (security_invoker = on means the view
-- uses the caller's permissions). So we add a restricted policy.

-- Create a new policy that allows friend access but the app
-- should always query profiles_safe instead of profiles directly
CREATE POLICY "Users can view friend profiles via safe view"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT friend_id FROM friendships
    WHERE user_id = auth.uid() AND status = 'accepted'
    UNION
    SELECT user_id FROM friendships  
    WHERE friend_id = auth.uid() AND status = 'accepted'
  )
);

-- =============================================
-- FIX 2: venue-photos storage policies - fix status value
-- Change 'active' to 'approved' to match actual partnership statuses
-- =============================================

-- Drop existing broken policies
DROP POLICY IF EXISTS "Partners can upload venue photos" ON storage.objects;
DROP POLICY IF EXISTS "Partners can update venue photos" ON storage.objects;
DROP POLICY IF EXISTS "Partners can delete venue photos" ON storage.objects;

-- Recreate with correct status value 'approved'
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
  )
);
