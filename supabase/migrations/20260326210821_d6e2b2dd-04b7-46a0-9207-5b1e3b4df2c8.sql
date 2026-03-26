
-- Add verification fields to partner_profiles
ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_method text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tax_id_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tax_id_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verification_deadline timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS address_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_notes text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz DEFAULT NULL;

-- Create index for quick lookup of unverified partners
CREATE INDEX IF NOT EXISTS idx_partner_profiles_verification_status 
  ON public.partner_profiles(verification_status);

-- Add a trigger to auto-set verification_deadline on insert
CREATE OR REPLACE FUNCTION public.set_partner_verification_deadline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.verification_deadline IS NULL THEN
    NEW.verification_deadline := NOW() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_verification_deadline ON public.partner_profiles;
CREATE TRIGGER trigger_set_verification_deadline
  BEFORE INSERT ON public.partner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_partner_verification_deadline();
