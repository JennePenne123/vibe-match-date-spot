-- Create optimized function to count perfect pair matches for a user
-- This function counts how many times both partners rated each other 5 stars
CREATE OR REPLACE FUNCTION public.count_perfect_pairs(target_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_five_star_ratings AS (
    SELECT invitation_id
    FROM date_feedback
    WHERE user_id = target_user_id
      AND rating = 5
  ),
  partner_five_star_ratings AS (
    SELECT df.invitation_id
    FROM date_feedback df
    INNER JOIN user_five_star_ratings ufsr ON df.invitation_id = ufsr.invitation_id
    WHERE df.user_id != target_user_id
      AND df.rating = 5
  )
  SELECT COUNT(*)::integer
  FROM partner_five_star_ratings;
$$;

COMMENT ON FUNCTION public.count_perfect_pairs IS 'Efficiently counts mutual 5-star ratings for perfect pair badge calculation';
