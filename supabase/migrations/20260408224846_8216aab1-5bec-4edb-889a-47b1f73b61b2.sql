
DROP VIEW IF EXISTS public.profiles_safe;

CREATE VIEW public.profiles_safe
WITH (security_invoker = on) AS
SELECT
  id,
  name,
  avatar_url,
  created_at,
  updated_at
FROM public.profiles;

GRANT SELECT ON public.profiles_safe TO authenticated;
GRANT SELECT ON public.profiles_safe TO anon;

-- Re-add friend policy on base table (needed for security_invoker view)
CREATE POLICY "Friends can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT friend_id FROM friendships
    WHERE user_id = auth.uid() AND status = 'accepted'
    UNION
    SELECT user_id FROM friendships
    WHERE friend_id = auth.uid() AND status = 'accepted'
  )
);
