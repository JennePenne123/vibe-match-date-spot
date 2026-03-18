
-- Fix UPDATE policy to include WITH CHECK for upsert support
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
