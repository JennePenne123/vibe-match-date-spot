-- Update the profiles table RLS policy to allow viewing friend profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can view friend profiles"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT friend_id FROM friendships 
    WHERE user_id = auth.uid() AND status = 'accepted'
    UNION
    SELECT user_id FROM friendships 
    WHERE friend_id = auth.uid() AND status = 'accepted'
  )
);