CREATE TABLE public.venue_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  invitation_id uuid REFERENCES public.date_invitations(id) ON DELETE SET NULL,
  venue_id text NOT NULL,
  venue_name text,
  venue_latitude numeric,
  venue_longitude numeric,
  arrived_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  verified boolean NOT NULL DEFAULT false,
  verification_method text NOT NULL DEFAULT 'manual',
  closest_distance_m numeric,
  rating_prompt_at timestamptz,
  rating_prompted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT venue_visits_method_check CHECK (verification_method IN ('manual', 'auto'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.venue_visits TO authenticated;
GRANT ALL ON public.venue_visits TO service_role;

ALTER TABLE public.venue_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own visits" ON public.venue_visits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own visits" ON public.venue_visits
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own visits" ON public.venue_visits
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own visits" ON public.venue_visits
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_venue_visits_user_open ON public.venue_visits (user_id, left_at);
CREATE INDEX idx_venue_visits_prompt ON public.venue_visits (user_id, rating_prompted, rating_prompt_at);

CREATE TRIGGER update_venue_visits_updated_at
  BEFORE UPDATE ON public.venue_visits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.date_feedback
  ADD COLUMN IF NOT EXISTS visit_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visit_verification_method text;