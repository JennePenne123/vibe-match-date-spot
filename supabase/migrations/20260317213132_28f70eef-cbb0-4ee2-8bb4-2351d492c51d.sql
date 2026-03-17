
-- Error logs table for in-app error monitoring
CREATE TABLE public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type text NOT NULL DEFAULT 'unknown',
  error_message text NOT NULL,
  error_stack text,
  component_name text,
  route text,
  metadata jsonb DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'error',
  user_agent text,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read error logs
CREATE POLICY "Admins can view error logs"
  ON public.error_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone authenticated can insert (so the client can log errors)
CREATE POLICY "Authenticated users can insert error logs"
  ON public.error_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can update (mark resolved)
CREATE POLICY "Admins can update error logs"
  ON public.error_logs FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete old logs
CREATE POLICY "Admins can delete error logs"
  ON public.error_logs FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Deny anonymous
CREATE POLICY "Deny anonymous access to error logs"
  ON public.error_logs FOR ALL
  TO anon
  USING (false);

-- Index for fast admin queries
CREATE INDEX idx_error_logs_created_at ON public.error_logs(created_at DESC);
CREATE INDEX idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX idx_error_logs_severity ON public.error_logs(severity);
