
-- Add legal acceptance tracking to partner_profiles
ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS terms_version text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS privacy_version text DEFAULT NULL;
