-- Cleanup: Remove remaining old permissive policies that still exist

-- ai_compatibility_scores: Remove the remaining ALL policy
DROP POLICY IF EXISTS "Authenticated system can manage compatibility scores" ON ai_compatibility_scores;

-- ai_venue_scores: Remove the remaining ALL policy
DROP POLICY IF EXISTS "Authenticated system can manage venue scores" ON ai_venue_scores;

-- ai_date_recommendations: Remove the remaining ALL policy  
DROP POLICY IF EXISTS "Authenticated system can manage recommendations" ON ai_date_recommendations;

-- user_preference_vectors: Remove the remaining ALL policy
DROP POLICY IF EXISTS "Authenticated system can manage preference vectors" ON user_preference_vectors;

-- Also clean up duplicate SELECT policies if they exist
DROP POLICY IF EXISTS "Users can view their compatibility scores" ON ai_compatibility_scores;
DROP POLICY IF EXISTS "Users can view their venue scores" ON ai_venue_scores;
DROP POLICY IF EXISTS "Users can view their recommendations" ON ai_date_recommendations;
DROP POLICY IF EXISTS "Users can view their preference vectors" ON user_preference_vectors;