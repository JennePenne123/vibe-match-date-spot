
-- Create AI compatibility scores table
CREATE TABLE public.ai_compatibility_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  cuisine_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  vibe_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  price_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  timing_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  activity_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  compatibility_factors JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

-- Create AI venue scores table
CREATE TABLE public.ai_venue_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  ai_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  match_factors JSONB,
  contextual_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  weather_factor NUMERIC(3,2) DEFAULT 1.00,
  time_factor NUMERIC(3,2) DEFAULT 1.00,
  crowd_factor NUMERIC(3,2) DEFAULT 1.00,
  event_factor NUMERIC(3,2) DEFAULT 1.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(venue_id, user_id)
);

-- Create AI date recommendations table
CREATE TABLE public.ai_date_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id UUID NOT NULL,
  user2_id UUID NOT NULL,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  overall_match_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  ai_reasoning TEXT,
  recommendation_factors JSONB,
  optimal_time TIMESTAMP WITH TIME ZONE,
  backup_venues UUID[],
  confidence_level NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user preference vectors table for ML
CREATE TABLE public.user_preference_vectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  cuisine_vector NUMERIC[],
  vibe_vector NUMERIC[],
  price_vector NUMERIC[],
  time_vector NUMERIC[],
  activity_vector NUMERIC[],
  feature_weights JSONB,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  learning_data JSONB
);

-- Add RLS policies for AI compatibility scores
ALTER TABLE public.ai_compatibility_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their compatibility scores" 
  ON public.ai_compatibility_scores 
  FOR SELECT 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can insert compatibility scores" 
  ON public.ai_compatibility_scores 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update compatibility scores" 
  ON public.ai_compatibility_scores 
  FOR UPDATE 
  USING (true);

-- Add RLS policies for AI venue scores
ALTER TABLE public.ai_venue_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their venue scores" 
  ON public.ai_venue_scores 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage venue scores" 
  ON public.ai_venue_scores 
  FOR ALL 
  USING (true);

-- Add RLS policies for AI date recommendations
ALTER TABLE public.ai_date_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their recommendations" 
  ON public.ai_date_recommendations 
  FOR SELECT 
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "System can manage recommendations" 
  ON public.ai_date_recommendations 
  FOR ALL 
  USING (true);

-- Add RLS policies for user preference vectors
ALTER TABLE public.user_preference_vectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their preference vectors" 
  ON public.user_preference_vectors 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage preference vectors" 
  ON public.user_preference_vectors 
  FOR ALL 
  USING (true);

-- Add indexes for performance
CREATE INDEX idx_ai_compatibility_users ON public.ai_compatibility_scores(user1_id, user2_id);
CREATE INDEX idx_ai_venue_scores_user ON public.ai_venue_scores(user_id);
CREATE INDEX idx_ai_venue_scores_venue ON public.ai_venue_scores(venue_id);
CREATE INDEX idx_ai_recommendations_users ON public.ai_date_recommendations(user1_id, user2_id);
CREATE INDEX idx_user_preference_vectors_user ON public.user_preference_vectors(user_id);

-- Enable realtime for AI recommendations
ALTER TABLE public.ai_date_recommendations REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.ai_date_recommendations;
