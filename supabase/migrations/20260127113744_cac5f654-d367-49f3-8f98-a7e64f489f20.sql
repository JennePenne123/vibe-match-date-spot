-- Security Fix: Replace overly permissive RLS policies on AI tables with user-scoped policies
-- Issue: Authenticated users could manipulate other users' AI data

-- =====================================================
-- 1. FIX ai_compatibility_scores
-- =====================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated system can manage compatibility scores" ON ai_compatibility_scores;
DROP POLICY IF EXISTS "Users can manage their own compatibility scores" ON ai_compatibility_scores;
DROP POLICY IF EXISTS "Users can update their compatibility scores" ON ai_compatibility_scores;
DROP POLICY IF EXISTS "Users can view their compatibility scores" ON ai_compatibility_scores;
DROP POLICY IF EXISTS "Users can delete their compatibility scores" ON ai_compatibility_scores;

-- Create proper user-scoped policies
CREATE POLICY "Users can view their own compatibility scores"
  ON ai_compatibility_scores
  FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert their own compatibility scores"
  ON ai_compatibility_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their own compatibility scores"
  ON ai_compatibility_scores
  FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete their own compatibility scores"
  ON ai_compatibility_scores
  FOR DELETE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- =====================================================
-- 2. FIX ai_venue_scores
-- =====================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated system can manage venue scores" ON ai_venue_scores;
DROP POLICY IF EXISTS "Users can manage their own venue scores" ON ai_venue_scores;

-- Create proper user-scoped policies
CREATE POLICY "Users can view their own venue scores"
  ON ai_venue_scores
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own venue scores"
  ON ai_venue_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own venue scores"
  ON ai_venue_scores
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own venue scores"
  ON ai_venue_scores
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. FIX ai_date_recommendations
-- =====================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated system can manage recommendations" ON ai_date_recommendations;
DROP POLICY IF EXISTS "Users can manage their recommendations" ON ai_date_recommendations;

-- Create proper user-scoped policies
CREATE POLICY "Users can view their own recommendations"
  ON ai_date_recommendations
  FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert their own recommendations"
  ON ai_date_recommendations
  FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their own recommendations"
  ON ai_date_recommendations
  FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can delete their own recommendations"
  ON ai_date_recommendations
  FOR DELETE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- =====================================================
-- 4. FIX user_preference_vectors
-- =====================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated system can manage preference vectors" ON user_preference_vectors;
DROP POLICY IF EXISTS "Users can manage their own preference vectors" ON user_preference_vectors;

-- Create proper user-scoped policies
CREATE POLICY "Users can view their own preference vectors"
  ON user_preference_vectors
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preference vectors"
  ON user_preference_vectors
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preference vectors"
  ON user_preference_vectors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preference vectors"
  ON user_preference_vectors
  FOR DELETE
  USING (auth.uid() = user_id);