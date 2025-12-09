-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referee_id UUID,
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  signup_points_awarded BOOLEAN DEFAULT false,
  completion_points_awarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'signed_up', 'completed', 'expired'))
);

-- Add referral tracking columns to user_points
ALTER TABLE public.user_points 
ADD COLUMN IF NOT EXISTS referral_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_points_earned INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Create unique referral code for existing users
UPDATE public.user_points 
SET referral_code = UPPER(SUBSTRING(MD5(user_id::text || created_at::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Enable realtime for referrals
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;

-- RLS Policies for referrals
CREATE POLICY "Users can view referrals they created"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals where they are referee"
ON public.referrals
FOR SELECT
USING (auth.uid() = referee_id);

CREATE POLICY "Users can create referrals"
ON public.referrals
FOR INSERT
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "System can update referrals"
ON public.referrals
FOR UPDATE
USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Create index for faster lookups
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_user_points_referral_code ON public.user_points(referral_code);

-- Function to generate referral code for new users
CREATE OR REPLACE FUNCTION public.generate_user_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.user_id::text || NEW.created_at::text) FROM 1 FOR 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-generate referral code
CREATE TRIGGER generate_referral_code_trigger
BEFORE INSERT ON public.user_points
FOR EACH ROW
WHEN (NEW.referral_code IS NULL)
EXECUTE FUNCTION public.generate_user_referral_code();