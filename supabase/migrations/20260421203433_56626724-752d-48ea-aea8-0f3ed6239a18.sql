
-- Onboarding Funnel Events: granular tracking of where users drop off
CREATE TABLE public.onboarding_funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text NOT NULL,
  funnel_name text NOT NULL DEFAULT 'onboarding',
  step_key text NOT NULL,
  step_index integer NOT NULL,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_funnel_events_session ON public.onboarding_funnel_events (session_id, created_at);
CREATE INDEX idx_funnel_events_funnel_step ON public.onboarding_funnel_events (funnel_name, step_index, created_at DESC);
CREATE INDEX idx_funnel_events_created ON public.onboarding_funnel_events (created_at DESC);

ALTER TABLE public.onboarding_funnel_events ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon visitors on /welcome before auth) can log their own funnel step.
-- We accept either authenticated user_id matching auth.uid OR anonymous events with user_id NULL.
CREATE POLICY "Anyone can insert their own funnel events"
ON public.onboarding_funnel_events
FOR INSERT
TO authenticated, anon
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

-- Admins can read all funnel data for analytics
CREATE POLICY "Admins can view funnel events"
ON public.onboarding_funnel_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own funnel events (debug / data export)
CREATE POLICY "Users can view their own funnel events"
ON public.onboarding_funnel_events
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
