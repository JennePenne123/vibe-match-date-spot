
-- Add membership fields to partner_profiles
ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS membership_tier text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS membership_valid_until timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_founding_partner boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS founding_partner_claimed_at timestamp with time zone DEFAULT NULL;
