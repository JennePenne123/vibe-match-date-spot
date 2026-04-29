-- 1. Feature Flags Tabelle
CREATE TABLE public.feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key text NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read feature flags"
  ON public.feature_flags FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert feature flags"
  ON public.feature_flags FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update feature flags"
  ON public.feature_flags FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete feature flags"
  ON public.feature_flags FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Initialer Flag (versteckt, bis Partnerschaft aktiv)
INSERT INTO public.feature_flags (flag_key, enabled, description, metadata)
VALUES (
  'dehoga_onboarding_enabled',
  false,
  'Aktiviert das DEHOGA-Mitglieder-Onboarding und Trust-Badge in der App.',
  jsonb_build_object(
    'preview_token', 'hioutz-dehoga-2026',
    'pricing', jsonb_build_object('pro', 9.99, 'business', 21.90, 'premium', 42.90),
    'standard_pricing', jsonb_build_object('pro', 13.90, 'business', 29.90, 'premium', 59.90)
  )
);

-- 2. DEHOGA Invitation Codes
CREATE TABLE public.dehoga_invitation_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  landesverband text,
  notes text,
  valid_until timestamp with time zone,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_dehoga_codes_code ON public.dehoga_invitation_codes(code);
CREATE INDEX idx_dehoga_codes_used_by ON public.dehoga_invitation_codes(used_by);

ALTER TABLE public.dehoga_invitation_codes ENABLE ROW LEVEL SECURITY;

-- Nur Admins lesen/verwalten direkt; Validierung läuft über Edge Function (Service Role)
CREATE POLICY "Admins can view dehoga codes"
  ON public.dehoga_invitation_codes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert dehoga codes"
  ON public.dehoga_invitation_codes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update dehoga codes"
  ON public.dehoga_invitation_codes FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete dehoga codes"
  ON public.dehoga_invitation_codes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_dehoga_codes_updated_at
  BEFORE UPDATE ON public.dehoga_invitation_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. partner_profiles erweitern
ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS is_dehoga_member boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dehoga_member_id text,
  ADD COLUMN IF NOT EXISTS dehoga_landesverband text,
  ADD COLUMN IF NOT EXISTS dehoga_verified_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS dehoga_verification_method text
    CHECK (dehoga_verification_method IN ('member_id', 'invitation_code') OR dehoga_verification_method IS NULL);

-- 4. Schutz-Trigger erweitern: DEHOGA-Felder nur durch Admin/Service-Role setzbar
CREATE OR REPLACE FUNCTION public.protect_partner_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Admins dürfen alles
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Bestehende Schutz-Logik
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     AND NEW.verification_status NOT IN ('pending_review', 'unverified') THEN
    RAISE EXCEPTION 'Cannot modify verification_status to %', NEW.verification_status;
  END IF;

  IF NEW.verified_at IS DISTINCT FROM OLD.verified_at THEN
    RAISE EXCEPTION 'Cannot modify verified_at';
  END IF;

  IF NEW.tax_id_verified IS DISTINCT FROM OLD.tax_id_verified AND NEW.tax_id_verified = true THEN
    RAISE EXCEPTION 'Cannot self-verify tax_id';
  END IF;

  IF NEW.address_verified IS DISTINCT FROM OLD.address_verified AND NEW.address_verified = true THEN
    RAISE EXCEPTION 'Cannot self-verify address';
  END IF;

  IF NEW.membership_tier IS DISTINCT FROM OLD.membership_tier THEN
    RAISE EXCEPTION 'Cannot modify membership_tier';
  END IF;

  IF NEW.membership_valid_until IS DISTINCT FROM OLD.membership_valid_until THEN
    RAISE EXCEPTION 'Cannot modify membership_valid_until';
  END IF;

  IF NEW.is_founding_partner IS DISTINCT FROM OLD.is_founding_partner THEN
    RAISE EXCEPTION 'Cannot modify founding partner status';
  END IF;

  IF NEW.founding_partner_claimed_at IS DISTINCT FROM OLD.founding_partner_claimed_at THEN
    RAISE EXCEPTION 'Cannot modify founding_partner_claimed_at';
  END IF;

  IF NEW.loyalty_bonus_awarded IS DISTINCT FROM OLD.loyalty_bonus_awarded THEN
    RAISE EXCEPTION 'Cannot modify loyalty_bonus_awarded';
  END IF;

  IF NEW.paid_pro_since IS DISTINCT FROM OLD.paid_pro_since THEN
    RAISE EXCEPTION 'Cannot modify paid_pro_since';
  END IF;

  IF NEW.network_discount_value IS DISTINCT FROM OLD.network_discount_value THEN
    RAISE EXCEPTION 'Cannot modify network_discount_value';
  END IF;

  -- DEHOGA-Felder: nur Admin oder Service-Role (über Edge Function)
  IF NEW.is_dehoga_member IS DISTINCT FROM OLD.is_dehoga_member THEN
    RAISE EXCEPTION 'Cannot self-set DEHOGA membership; verification required';
  END IF;

  IF NEW.dehoga_verified_at IS DISTINCT FROM OLD.dehoga_verified_at THEN
    RAISE EXCEPTION 'Cannot modify dehoga_verified_at';
  END IF;

  IF NEW.dehoga_verification_method IS DISTINCT FROM OLD.dehoga_verification_method THEN
    RAISE EXCEPTION 'Cannot modify dehoga_verification_method';
  END IF;

  RETURN NEW;
END;
$function$;

-- Trigger anhängen, falls noch nicht vorhanden
DROP TRIGGER IF EXISTS protect_partner_profile_fields_trigger ON public.partner_profiles;
CREATE TRIGGER protect_partner_profile_fields_trigger
  BEFORE UPDATE ON public.partner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_partner_profile_fields();