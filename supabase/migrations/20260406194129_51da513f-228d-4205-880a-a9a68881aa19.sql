
-- 1. Fix request_logs: Replace permissive INSERT policy with a SECURITY DEFINER function
DROP POLICY IF EXISTS "Service role can insert logs" ON public.request_logs;

CREATE OR REPLACE FUNCTION public.insert_request_log(
  p_identifier_hash text,
  p_function_name text,
  p_client_ip_hash text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_request_count integer DEFAULT NULL,
  p_was_rate_limited boolean DEFAULT false,
  p_abuse_score integer DEFAULT 0,
  p_limit_threshold integer DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.request_logs (
    identifier_hash, function_name, client_ip_hash, user_agent,
    request_count, was_rate_limited, abuse_score, limit_threshold, metadata
  ) VALUES (
    p_identifier_hash, p_function_name, p_client_ip_hash, p_user_agent,
    p_request_count, p_was_rate_limited, p_abuse_score, p_limit_threshold, p_metadata
  );
END;
$$;

-- 2. Fix user_roles: Add explicit INSERT restriction for non-admins
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3. Fix venue-photos: Add UPDATE policy for storage objects
CREATE POLICY "Partners can update venue photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'venue-photos'
    AND EXISTS (
      SELECT 1 FROM venue_partnerships vp
      WHERE vp.partner_id = auth.uid()
        AND vp.status = 'active'
        AND (storage.foldername(name))[1] = vp.venue_id
    )
  )
  WITH CHECK (
    bucket_id = 'venue-photos'
    AND EXISTS (
      SELECT 1 FROM venue_partnerships vp
      WHERE vp.partner_id = auth.uid()
        AND vp.status = 'active'
        AND (storage.foldername(name))[1] = vp.venue_id
    )
  );
