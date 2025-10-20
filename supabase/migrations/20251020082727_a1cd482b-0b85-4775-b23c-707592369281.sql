-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can send messages for their invitations" ON invitation_messages;

-- Create a new, more permissive INSERT policy
-- Allow messaging for all statuses except when date is completed
CREATE POLICY "Users can send messages for their invitations"
ON invitation_messages
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = sender_id 
  AND EXISTS (
    SELECT 1 FROM date_invitations
    WHERE date_invitations.id = invitation_messages.invitation_id
      AND (date_invitations.sender_id = auth.uid() OR date_invitations.recipient_id = auth.uid())
      AND (date_invitations.date_status IS NULL OR date_invitations.date_status != 'completed')
  )
);