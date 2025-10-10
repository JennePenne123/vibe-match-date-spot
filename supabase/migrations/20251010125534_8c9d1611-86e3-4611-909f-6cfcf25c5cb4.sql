-- Fix security warnings for Phase 1 tables (fixed version)

-- 1. Drop trigger first, then function, then recreate both with proper security
DROP TRIGGER IF EXISTS on_profile_created_init_points ON profiles;
DROP FUNCTION IF EXISTS initialize_user_points() CASCADE;

CREATE OR REPLACE FUNCTION initialize_user_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_points (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public;

-- Recreate trigger
CREATE TRIGGER on_profile_created_init_points
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_points();

-- 2. Update RLS policies to explicitly block anonymous users

-- Drop and recreate user_points policies with authenticated requirement
DROP POLICY IF EXISTS "Users can view their own points" ON user_points;
DROP POLICY IF EXISTS "Users can view leaderboard (all points)" ON user_points;
DROP POLICY IF EXISTS "Authenticated users can view leaderboard" ON user_points;
DROP POLICY IF EXISTS "Users can insert their own points" ON user_points;
DROP POLICY IF EXISTS "Users can update their own points" ON user_points;

CREATE POLICY "Users can view their own points"
  ON user_points FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view leaderboard"
  ON user_points FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own points"
  ON user_points FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own points"
  ON user_points FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Drop and recreate feedback_rewards policies with authenticated requirement
DROP POLICY IF EXISTS "Users can view their own rewards" ON feedback_rewards;
DROP POLICY IF EXISTS "Users can insert their own rewards" ON feedback_rewards;

CREATE POLICY "Users can view their own rewards"
  ON feedback_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewards"
  ON feedback_rewards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);