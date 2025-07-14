-- Add support for group date planning
ALTER TABLE date_planning_sessions 
ADD COLUMN participant_ids JSONB DEFAULT NULL;