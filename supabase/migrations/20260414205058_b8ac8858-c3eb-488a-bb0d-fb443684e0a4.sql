
-- 1. Fix Realtime channel policy: restrict to prefix-only pattern (userId:*)
-- Remove the dangerous suffix/infix patterns
DROP POLICY IF EXISTS "Users can only access own channels" ON realtime.messages;
CREATE POLICY "Users can only access own channels"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = (auth.uid())::text
    OR realtime.topic() LIKE ((auth.uid())::text || ':%')
  );

-- 2. Fix profiles visibility: allow authenticated users to read basic profile info
-- This enables social features (friend names, avatars) without exposing email
CREATE POLICY "Authenticated users can view basic profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
