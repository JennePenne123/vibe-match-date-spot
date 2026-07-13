
-- Harden count_perfect_pairs: add internal authorization so a signed-in user
-- can only query their own "perfect pairs" count (admins may query any).
CREATE OR REPLACE FUNCTION public.count_perfect_pairs(target_user_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF auth.uid() <> target_user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Cannot view other users data';
  END IF;

  RETURN (
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
      WHERE df.user_id <> target_user_id
        AND df.rating = 5
    )
    SELECT COUNT(*)::integer FROM partner_five_star_ratings
  );
END;
$function$;

-- Ensure no anonymous / public execution of this SECURITY DEFINER function.
REVOKE ALL ON FUNCTION public.count_perfect_pairs(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.count_perfect_pairs(uuid) TO authenticated, service_role;
