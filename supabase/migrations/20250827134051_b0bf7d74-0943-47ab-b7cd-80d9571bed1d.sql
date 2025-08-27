-- Clear all testing data for fresh Smart Date Planner testing

-- 1. Clear Date Proposals
DELETE FROM date_proposals;

-- 2. Clear Planning Sessions
DELETE FROM date_planning_sessions;

-- 3. Clear AI Data
DELETE FROM ai_compatibility_scores;
DELETE FROM ai_date_recommendations;
DELETE FROM ai_venue_scores;

-- 4. Clear User Feedback
DELETE FROM user_venue_feedback;
DELETE FROM date_feedback;

-- 5. Clear Date Invitations (if any exist)
DELETE FROM date_invitations;

-- Reset sequences if needed (PostgreSQL automatically handles UUIDs)
-- No sequence resets needed for UUID primary keys