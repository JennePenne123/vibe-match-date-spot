-- Create date proposals table for pre-planning agreement system
CREATE TABLE public.date_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposer_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  proposed_date TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  planning_session_id UUID REFERENCES public.date_planning_sessions(id)
);

-- Enable RLS
ALTER TABLE public.date_proposals ENABLE ROW LEVEL SECURITY;

-- Create policies for date proposals
CREATE POLICY "Users can create proposals they send" 
ON public.date_proposals 
FOR INSERT 
WITH CHECK (auth.uid() = proposer_id);

CREATE POLICY "Users can view their proposals" 
ON public.date_proposals 
FOR SELECT 
USING (auth.uid() = proposer_id OR auth.uid() = recipient_id);

CREATE POLICY "Recipients can update proposal status" 
ON public.date_proposals 
FOR UPDATE 
USING (auth.uid() = recipient_id OR auth.uid() = proposer_id);

-- Add trigger for updated_at
CREATE TRIGGER update_date_proposals_updated_at
BEFORE UPDATE ON public.date_proposals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add planning mode and collaboration fields to existing date_planning_sessions
ALTER TABLE public.date_planning_sessions 
ADD COLUMN planning_mode TEXT NOT NULL DEFAULT 'solo' CHECK (planning_mode IN ('solo', 'collaborative')),
ADD COLUMN initiator_preferences_complete BOOLEAN DEFAULT false,
ADD COLUMN partner_preferences_complete BOOLEAN DEFAULT false,
ADD COLUMN mutual_venue_selection BOOLEAN DEFAULT false;