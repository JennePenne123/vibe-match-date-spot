
-- Add lifetime_xp column to user_points
ALTER TABLE public.user_points
  ADD COLUMN IF NOT EXISTS lifetime_xp integer NOT NULL DEFAULT 0;

-- Seed lifetime_xp from existing total_points (so no one loses progress)
UPDATE public.user_points SET lifetime_xp = total_points WHERE lifetime_xp = 0 AND total_points > 0;

-- Update award_user_points to handle dual currency
CREATE OR REPLACE FUNCTION public.award_user_points(
  target_user_id uuid,
  points_to_add integer,
  new_badges jsonb DEFAULT NULL,
  xp_to_add integer DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actual_xp integer;
  new_lifetime_xp integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != target_user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify other users points';
  END IF;

  -- If xp_to_add is not provided, default to same as points (backward compat)
  actual_xp := COALESCE(xp_to_add, points_to_add);

  UPDATE public.user_points
  SET 
    total_points = total_points + points_to_add,
    lifetime_xp = lifetime_xp + actual_xp,
    badges = CASE 
      WHEN new_badges IS NOT NULL THEN badges || new_badges
      ELSE badges
    END,
    -- Level is based on lifetime_xp, not spendable coins
    level = CASE
      WHEN (lifetime_xp + actual_xp) >= 120000 THEN 7
      WHEN (lifetime_xp + actual_xp) >= 65000 THEN 6
      WHEN (lifetime_xp + actual_xp) >= 35000 THEN 5
      WHEN (lifetime_xp + actual_xp) >= 15000 THEN 4
      WHEN (lifetime_xp + actual_xp) >= 6000 THEN 3
      WHEN (lifetime_xp + actual_xp) >= 1500 THEN 2
      ELSE 1
    END,
    updated_at = NOW()
  WHERE user_id = target_user_id;

  RETURN FOUND;
END;
$$;
