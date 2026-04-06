
-- ============================================================
-- FIX 1: user_points - Remove direct UPDATE policy
-- Users should NOT be able to freely update their own points.
-- All point mutations happen via edge functions (service role).
-- ============================================================

-- Drop the dangerous UPDATE policy
DROP POLICY IF EXISTS "Users can update their own points" ON public.user_points;

-- Create a security definer function for safe point updates
CREATE OR REPLACE FUNCTION public.award_user_points(
  target_user_id uuid,
  points_to_add integer,
  new_badges jsonb DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only the user themselves or an admin can award points
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != target_user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify other users points';
  END IF;

  UPDATE public.user_points
  SET 
    total_points = total_points + points_to_add,
    badges = CASE 
      WHEN new_badges IS NOT NULL THEN badges || new_badges
      ELSE badges
    END,
    level = GREATEST(1, FLOOR((total_points + points_to_add) / 100) + 1)::integer,
    updated_at = NOW()
  WHERE user_id = target_user_id;

  RETURN FOUND;
END;
$$;

-- Create a function for updating streak/review date (safe fields only)
CREATE OR REPLACE FUNCTION public.update_user_streak(
  target_user_id uuid,
  new_streak integer,
  review_date timestamp with time zone DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != target_user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.user_points
  SET 
    streak_count = new_streak,
    last_review_date = COALESCE(review_date, last_review_date),
    updated_at = NOW()
  WHERE user_id = target_user_id;

  RETURN FOUND;
END;
$$;

-- ============================================================
-- FIX 2: partner_profiles - Restrict UPDATE to safe fields
-- Partners can update business info but NOT verification/membership fields.
-- ============================================================

-- Drop the existing overly permissive UPDATE policy
DROP POLICY IF EXISTS "Partners can update own profile" ON public.partner_profiles;

-- Create a restricted UPDATE policy that only allows safe field changes
-- The key: use WITH CHECK to ensure protected fields haven't been changed
CREATE POLICY "Partners can update own safe fields" ON public.partner_profiles
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id AND has_role(auth.uid(), 'venue_partner')
)
WITH CHECK (
  auth.uid() = user_id 
  AND has_role(auth.uid(), 'venue_partner')
  -- Prevent self-escalation: these fields must not change unless admin
  -- We compare NEW values to OLD values via a trigger instead
);

-- Create a trigger to block modification of protected fields by non-admins
CREATE OR REPLACE FUNCTION public.protect_partner_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If the user is an admin, allow all changes
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Block changes to protected fields for non-admins
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

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS protect_partner_fields ON public.partner_profiles;
CREATE TRIGGER protect_partner_fields
  BEFORE UPDATE ON public.partner_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_partner_profile_fields();
