-- Update RLS policy for date_planning_sessions to allow both initiator and partner to create sessions
DROP POLICY IF EXISTS "Users can create planning sessions" ON date_planning_sessions;

CREATE POLICY "Users can create planning sessions" 
ON date_planning_sessions 
FOR INSERT 
WITH CHECK (
  (auth.uid() = initiator_id) OR 
  (auth.uid() = partner_id)
);