-- Clear all test user data completely using subqueries instead of CTEs

-- Delete compatibility scores
DELETE FROM ai_compatibility_scores 
WHERE user1_id IN (SELECT id FROM profiles WHERE email IN ('info@janwiechmann.de', 'janwiechmann@hotmail.com')) 
   OR user2_id IN (SELECT id FROM profiles WHERE email IN ('info@janwiechmann.de', 'janwiechmann@hotmail.com'));

-- Delete venue scores  
DELETE FROM ai_venue_scores 
WHERE user_id IN (SELECT id FROM profiles WHERE email IN ('info@janwiechmann.de', 'janwiechmann@hotmail.com'));

-- Delete venue feedback
DELETE FROM user_venue_feedback 
WHERE user_id IN (SELECT id FROM profiles WHERE email IN ('info@janwiechmann.de', 'janwiechmann@hotmail.com'));

-- Delete date invitations
DELETE FROM date_invitations 
WHERE sender_id IN (SELECT id FROM profiles WHERE email IN ('info@janwiechmann.de', 'janwiechmann@hotmail.com')) 
   OR recipient_id IN (SELECT id FROM profiles WHERE email IN ('info@janwiechmann.de', 'janwiechmann@hotmail.com'));

-- Delete planning sessions
DELETE FROM date_planning_sessions 
WHERE initiator_id IN (SELECT id FROM profiles WHERE email IN ('info@janwiechmann.de', 'janwiechmann@hotmail.com')) 
   OR partner_id IN (SELECT id FROM profiles WHERE email IN ('info@janwiechmann.de', 'janwiechmann@hotmail.com'));

-- Delete user preferences
DELETE FROM user_preferences 
WHERE user_id IN (SELECT id FROM profiles WHERE email IN ('info@janwiechmann.de', 'janwiechmann@hotmail.com'));

-- Delete AI date recommendations
DELETE FROM ai_date_recommendations 
WHERE user1_id IN (SELECT id FROM profiles WHERE email IN ('info@janwiechmann.de', 'janwiechmann@hotmail.com')) 
   OR user2_id IN (SELECT id FROM profiles WHERE email IN ('info@janwiechmann.de', 'janwiechmann@hotmail.com'));

-- Delete date proposals
DELETE FROM date_proposals 
WHERE proposer_id IN (SELECT id FROM profiles WHERE email IN ('info@janwiechmann.de', 'janwiechmann@hotmail.com')) 
   OR recipient_id IN (SELECT id FROM profiles WHERE email IN ('info@janwiechmann.de', 'janwiechmann@hotmail.com'));

-- Delete date feedback
DELETE FROM date_feedback 
WHERE user_id IN (SELECT id FROM profiles WHERE email IN ('info@janwiechmann.de', 'janwiechmann@hotmail.com'));

-- Delete user preference vectors
DELETE FROM user_preference_vectors 
WHERE user_id IN (SELECT id FROM profiles WHERE email IN ('info@janwiechmann.de', 'janwiechmann@hotmail.com'));