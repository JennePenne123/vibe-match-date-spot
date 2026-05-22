-- Private storage bucket for DB backups
INSERT INTO storage.buckets (id, name, public)
VALUES ('db-backups', 'db-backups', false)
ON CONFLICT (id) DO NOTHING;

-- Only admins can view / list / download backup files
CREATE POLICY "Admins can read db-backups"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'db-backups' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete db-backups"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'db-backups' AND public.has_role(auth.uid(), 'admin'::app_role));
-- Note: writes are performed by the edge function with the service role, no INSERT policy needed.