-- Add loyalty bonus tracking fields to partner_profiles
ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS loyalty_bonus_awarded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS loyalty_bonus_awarded_at timestamptz,
  ADD COLUMN IF NOT EXISTS loyalty_bonus_months integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_pro_since timestamptz;