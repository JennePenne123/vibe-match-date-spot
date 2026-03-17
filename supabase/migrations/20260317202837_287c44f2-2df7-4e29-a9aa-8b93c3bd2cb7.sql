
-- Add premium_until to user_points for tracking premium membership expiry
ALTER TABLE public.user_points
ADD COLUMN premium_until timestamp with time zone DEFAULT NULL;

-- Create reward_redemptions table to track monthly limits
CREATE TABLE public.reward_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_type text NOT NULL CHECK (reward_type IN ('voucher', 'premium')),
  voucher_id uuid REFERENCES public.vouchers(id) ON DELETE SET NULL,
  points_spent integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own redemptions"
  ON public.reward_redemptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own redemptions"
  ON public.reward_redemptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access"
  ON public.reward_redemptions FOR ALL
  TO anon
  USING (false);

-- Index for monthly limit queries
CREATE INDEX idx_reward_redemptions_user_month
  ON public.reward_redemptions (user_id, created_at);
