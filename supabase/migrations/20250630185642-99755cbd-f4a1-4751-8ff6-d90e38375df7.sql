
-- Create date planning sessions table for collaborative planning
CREATE TABLE public.date_planning_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  initiator_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  session_status TEXT NOT NULL DEFAULT 'active',
  preferences_data JSONB,
  ai_compatibility_score NUMERIC(5,2),
  selected_venue_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Create date feedback table for learning and improvement
CREATE TABLE public.date_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id UUID NOT NULL REFERENCES public.date_invitations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  venue_rating INTEGER CHECK (venue_rating >= 1 AND venue_rating <= 5),
  ai_accuracy_rating INTEGER CHECK (ai_accuracy_rating >= 1 AND ai_accuracy_rating <= 5),
  feedback_text TEXT,
  would_recommend_venue BOOLEAN,
  would_use_ai_again BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhance date_invitations table with AI insights
ALTER TABLE public.date_invitations 
ADD COLUMN ai_compatibility_score NUMERIC(5,2),
ADD COLUMN ai_reasoning TEXT,
ADD COLUMN venue_match_factors JSONB,
ADD COLUMN ai_generated_message TEXT,
ADD COLUMN planning_session_id UUID REFERENCES public.date_planning_sessions(id);

-- Add RLS policies for date planning sessions
ALTER TABLE public.date_planning_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their planning sessions" 
  ON public.date_planning_sessions 
  FOR SELECT 
  USING (auth.uid() = initiator_id OR auth.uid() = partner_id);

CREATE POLICY "Users can create planning sessions" 
  ON public.date_planning_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = initiator_id);

CREATE POLICY "Users can update their planning sessions" 
  ON public.date_planning_sessions 
  FOR UPDATE 
  USING (auth.uid() = initiator_id OR auth.uid() = partner_id);

-- Add RLS policies for date feedback
ALTER TABLE public.date_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view feedback for their invitations" 
  ON public.date_feedback 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feedback" 
  ON public.date_feedback 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_date_planning_sessions_users ON public.date_planning_sessions(initiator_id, partner_id);
CREATE INDEX idx_date_planning_sessions_status ON public.date_planning_sessions(session_status);
CREATE INDEX idx_date_feedback_invitation ON public.date_feedback(invitation_id);

-- Enable realtime for collaborative planning
ALTER TABLE public.date_planning_sessions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.date_planning_sessions;
