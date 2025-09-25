-- Add 'converted' status to date_proposals status enum
ALTER TABLE date_proposals 
DROP CONSTRAINT IF EXISTS date_proposals_status_check;

ALTER TABLE date_proposals 
ADD CONSTRAINT date_proposals_status_check 
CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'converted'));