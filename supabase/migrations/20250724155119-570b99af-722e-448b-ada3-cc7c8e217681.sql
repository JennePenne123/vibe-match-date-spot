-- Add RLS policy to allow compatibility calculations between users
-- This allows users to read other users' preferences only for compatibility calculations
CREATE POLICY "Allow compatibility calculations" ON public.user_preferences
FOR SELECT 
USING (
  -- Allow if user is requesting their own preferences
  auth.uid() = user_id 
  OR 
  -- Allow if there's an active date planning session between the users
  EXISTS (
    SELECT 1 FROM public.date_planning_sessions 
    WHERE (
      (initiator_id = auth.uid() AND partner_id = user_preferences.user_id)
      OR 
      (partner_id = auth.uid() AND initiator_id = user_preferences.user_id)
    )
    AND session_status = 'active'
    AND expires_at > now()
  )
  OR
  -- Allow if there's a friendship between the users
  EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE (
      (user_id = auth.uid() AND friend_id = user_preferences.user_id)
      OR 
      (friend_id = auth.uid() AND user_id = user_preferences.user_id)
    )
    AND status = 'accepted'
  )
);