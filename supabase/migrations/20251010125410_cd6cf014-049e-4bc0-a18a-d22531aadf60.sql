-- Phase 1: Database Schema Updates for Date Rating System

-- 1. Add new columns to date_invitations table
ALTER TABLE date_invitations 
ADD COLUMN IF NOT EXISTS actual_date_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS date_status TEXT DEFAULT 'scheduled' 
  CHECK (date_status IN ('scheduled', 'completed', 'cancelled', 'no_show'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_date_status ON date_invitations(date_status);
CREATE INDEX IF NOT EXISTS idx_actual_date_time ON date_invitations(actual_date_time);
CREATE INDEX IF NOT EXISTS idx_completed_dates ON date_invitations(date_status, proposed_date) 
  WHERE date_status = 'scheduled';

-- 2. Create user_points table for gamification
CREATE TABLE IF NOT EXISTS user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_points INTEGER DEFAULT 0 NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  badges JSONB DEFAULT '[]'::jsonb NOT NULL,
  streak_count INTEGER DEFAULT 0 NOT NULL,
  last_review_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT fk_user_points_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index on total_points for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_points_total ON user_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);

-- Enable RLS on user_points
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_points
CREATE POLICY "Users can view their own points"
  ON user_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view leaderboard (all points)"
  ON user_points FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own points"
  ON user_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own points"
  ON user_points FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at on user_points
CREATE TRIGGER update_user_points_updated_at
  BEFORE UPDATE ON user_points
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. Create feedback_rewards table
CREATE TABLE IF NOT EXISTS feedback_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL,
  user_id UUID NOT NULL,
  points_earned INTEGER NOT NULL DEFAULT 0,
  badges_earned JSONB DEFAULT '[]'::jsonb NOT NULL,
  completion_level TEXT NOT NULL CHECK (completion_level IN ('basic', 'detailed', 'complete')),
  speed_bonus BOOLEAN DEFAULT false,
  both_rated_bonus BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT fk_feedback_rewards_feedback FOREIGN KEY (feedback_id) REFERENCES date_feedback(id) ON DELETE CASCADE,
  CONSTRAINT fk_feedback_rewards_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for feedback_rewards
CREATE INDEX IF NOT EXISTS idx_feedback_rewards_user_id ON feedback_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rewards_feedback_id ON feedback_rewards(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rewards_created_at ON feedback_rewards(created_at DESC);

-- Enable RLS on feedback_rewards
ALTER TABLE feedback_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_rewards
CREATE POLICY "Users can view their own rewards"
  ON feedback_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewards"
  ON feedback_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Add helper function to initialize user points
CREATE OR REPLACE FUNCTION initialize_user_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_points (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user_points when profile is created
CREATE TRIGGER on_profile_created_init_points
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_points();