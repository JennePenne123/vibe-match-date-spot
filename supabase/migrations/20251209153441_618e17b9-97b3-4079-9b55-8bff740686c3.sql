-- Create AI learning data table to track prediction accuracy
CREATE TABLE public.ai_learning_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  partner_id UUID,
  venue_id TEXT NOT NULL,
  invitation_id UUID REFERENCES public.date_invitations(id),
  
  -- AI predictions at time of recommendation
  predicted_score NUMERIC NOT NULL DEFAULT 0,
  predicted_factors JSONB DEFAULT '{}',
  
  -- Actual outcomes from feedback
  actual_rating INTEGER,
  venue_rating INTEGER,
  ai_accuracy_rating INTEGER,
  would_recommend BOOLEAN,
  
  -- Calculated learning metrics
  prediction_error NUMERIC,
  success_factors JSONB DEFAULT '[]',
  failure_factors JSONB DEFAULT '[]',
  
  -- Context at time of date
  context_data JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_learning_data ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own learning data"
ON public.ai_learning_data FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert learning data"
ON public.ai_learning_data FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can update learning data"
ON public.ai_learning_data FOR UPDATE
USING (auth.uid() = user_id);

-- Add learning-specific columns to user_preference_vectors if not exists
ALTER TABLE public.user_preference_vectors 
ADD COLUMN IF NOT EXISTS ai_accuracy NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS successful_predictions INTEGER DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX idx_ai_learning_data_user_id ON public.ai_learning_data(user_id);
CREATE INDEX idx_ai_learning_data_venue_id ON public.ai_learning_data(venue_id);

-- Update trigger for updated_at
CREATE TRIGGER update_ai_learning_data_updated_at
BEFORE UPDATE ON public.ai_learning_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();