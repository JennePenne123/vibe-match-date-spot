
-- =============================================
-- FIX 1: Remove direct friend access to user_preferences base table
-- Friends must use get_friend_preferences() function instead
-- =============================================
DROP POLICY IF EXISTS "Friends can view preferences for compatibility" ON public.user_preferences;

-- =============================================
-- FIX 2: Stricter realtime channel pattern
-- =============================================
DROP POLICY IF EXISTS "Users can only access own channels" ON realtime.messages;

CREATE POLICY "Users can only access own channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = auth.uid()::text
  OR realtime.topic() LIKE auth.uid()::text || ':%'
  OR realtime.topic() LIKE '%:' || auth.uid()::text
  OR realtime.topic() LIKE '%:' || auth.uid()::text || ':%'
);
