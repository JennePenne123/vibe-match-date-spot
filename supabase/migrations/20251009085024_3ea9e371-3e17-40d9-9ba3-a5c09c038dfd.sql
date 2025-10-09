-- Create invitation_messages table for threaded conversations
CREATE TABLE invitation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES date_invitations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  message TEXT NOT NULL CHECK (length(message) > 0 AND length(message) <= 1000),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_invitation_messages_invitation_id ON invitation_messages(invitation_id);
CREATE INDEX idx_invitation_messages_sender_id ON invitation_messages(sender_id);
CREATE INDEX idx_invitation_messages_created_at ON invitation_messages(created_at DESC);

-- Enable RLS
ALTER TABLE invitation_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view messages for their invitations
CREATE POLICY "Users can view messages for their invitations"
  ON invitation_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM date_invitations
      WHERE id = invitation_id
      AND (sender_id = auth.uid() OR recipient_id = auth.uid())
    )
  );

-- RLS Policy: Users can send messages for their invitations
CREATE POLICY "Users can send messages for their invitations"
  ON invitation_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM date_invitations
      WHERE id = invitation_id
      AND (sender_id = auth.uid() OR recipient_id = auth.uid())
      AND status = 'pending'
    )
  );

-- RLS Policy: Users can mark their received messages as read
CREATE POLICY "Users can mark received messages as read"
  ON invitation_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM date_invitations
      WHERE id = invitation_id
      AND recipient_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM date_invitations
      WHERE id = invitation_id
      AND recipient_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_invitation_messages_updated_at
  BEFORE UPDATE ON invitation_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE invitation_messages;