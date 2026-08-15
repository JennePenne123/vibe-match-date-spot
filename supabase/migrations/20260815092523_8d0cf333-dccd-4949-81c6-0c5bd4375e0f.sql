CREATE TABLE public.ai_experiment_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment TEXT NOT NULL,
  variant TEXT NOT NULL,
  event_type TEXT NOT NULL,
  venue_id TEXT,
  rating NUMERIC,
  ai_accuracy_rating NUMERIC,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT ai_experiment_events_variant_chk CHECK (variant IN ('control','treatment')),
  CONSTRAINT ai_experiment_events_event_chk CHECK (event_type IN ('recommendation_shown','venue_feedback','date_feedback')),
  CONSTRAINT ai_experiment_events_experiment_len CHECK (char_length(experiment) BETWEEN 1 AND 64)
);

CREATE INDEX idx_ai_experiment_events_exp_variant ON public.ai_experiment_events(experiment, variant, created_at DESC);
CREATE INDEX idx_ai_experiment_events_user ON public.ai_experiment_events(user_id, created_at DESC);

GRANT SELECT, INSERT ON public.ai_experiment_events TO authenticated;
GRANT ALL ON public.ai_experiment_events TO service_role;

ALTER TABLE public.ai_experiment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own experiment events"
ON public.ai_experiment_events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own experiment events"
ON public.ai_experiment_events FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all experiment events"
ON public.ai_experiment_events FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_experiment_summary(_experiment TEXT)
RETURNS TABLE (
  variant TEXT,
  users BIGINT,
  recommendations BIGINT,
  positive_feedback BIGINT,
  negative_feedback BIGINT,
  avg_rating NUMERIC,
  avg_ai_accuracy NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.variant,
    COUNT(DISTINCT e.user_id) AS users,
    COUNT(*) FILTER (WHERE e.event_type = 'recommendation_shown') AS recommendations,
    COUNT(*) FILTER (WHERE e.event_type = 'venue_feedback' AND e.metadata->>'feedback_type' IN ('like','super_like','visited','interested')) AS positive_feedback,
    COUNT(*) FILTER (WHERE e.event_type = 'venue_feedback' AND e.metadata->>'feedback_type' IN ('dislike','skip','not_interested')) AS negative_feedback,
    ROUND(AVG(e.rating) FILTER (WHERE e.rating IS NOT NULL), 2) AS avg_rating,
    ROUND(AVG(e.ai_accuracy_rating) FILTER (WHERE e.ai_accuracy_rating IS NOT NULL), 2) AS avg_ai_accuracy
  FROM public.ai_experiment_events e
  WHERE e.experiment = _experiment
    AND public.has_role(auth.uid(), 'admin')
  GROUP BY e.variant
  ORDER BY e.variant;
$$;

REVOKE ALL ON FUNCTION public.get_experiment_summary(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_experiment_summary(TEXT) TO authenticated;