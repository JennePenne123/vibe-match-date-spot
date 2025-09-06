
-- Clear all test user data completely
-- First, get the test user IDs
WITH test_users AS (
  SELECT id FROM profiles WHERE email IN ('info@janwiechmann.de', 'janwiechmann@hotmail.com')
)
-- Delete from all related tables
DELETE FROM ai_compatibility_scores WHERE user1_id IN (SELECT id FROM test_users) OR user2_id IN (SELECT id FROM test_users);

DELETE FROM ai_venue_scores WHERE user_id IN (SELECT id FROM test_users);

DELETE FROM user_venue_feedback WHERE user_id IN (SELECT id FROM test_users);

DELETE FROM date_invitations WHERE sender_id IN (SELECT id FROM test_users) OR recipient_id IN (SELECT id FROM test_users);

DELETE FROM date_planning_sessions WHERE initiator_id IN (SELECT id FROM test_users) OR partner_id IN (SELECT id FROM test_users);

DELETE FROM user_preferences WHERE user_id IN (SELECT id FROM test_users);

-- Also clear any AI date recommendations
DELETE FROM ai_date_recommendations WHERE user1_id IN (SELECT id FROM test_users) OR user2_id IN (SELECT id FROM test_users);

-- Clear any date proposals
DELETE FROM date_proposals WHERE proposer_id IN (SELECT id FROM test_users) OR recipient_id IN (SELECT id FROM test_users);

-- Clear any date feedback
DELETE FROM date_feedback WHERE user_id IN (SELECT id FROM test_users);

-- Clear user preference vectors
DELETE FROM user_preference_vectors WHERE user_id IN (SELECT id FROM test_users);
