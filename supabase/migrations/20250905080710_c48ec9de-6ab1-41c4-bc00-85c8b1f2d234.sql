-- Clear cached compatibility scores to force fresh calculations
DELETE FROM ai_compatibility_scores WHERE created_at < now() - interval '1 day';