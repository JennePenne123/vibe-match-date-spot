-- Conversations table for coding assistant
CREATE TABLE coding_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Messages table for conversation history
CREATE TABLE coding_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES coding_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task execution logs for tracking multi-step operations
CREATE TABLE coding_task_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES coding_conversations(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_coding_conversations_user_id ON coding_conversations(user_id);
CREATE INDEX idx_coding_conversations_updated_at ON coding_conversations(updated_at DESC);
CREATE INDEX idx_coding_messages_conversation_id ON coding_messages(conversation_id);
CREATE INDEX idx_coding_messages_created_at ON coding_messages(created_at);
CREATE INDEX idx_coding_task_logs_conversation_id ON coding_task_logs(conversation_id);
CREATE INDEX idx_coding_task_logs_status ON coding_task_logs(status);

-- Enable RLS
ALTER TABLE coding_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_task_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coding_conversations
CREATE POLICY "Users can view own conversations"
  ON coding_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON coding_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON coding_conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for coding_messages
CREATE POLICY "Users can view own messages"
  ON coding_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coding_conversations
      WHERE coding_conversations.id = coding_messages.conversation_id
      AND coding_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own messages"
  ON coding_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coding_conversations
      WHERE coding_conversations.id = coding_messages.conversation_id
      AND coding_conversations.user_id = auth.uid()
    )
  );

-- RLS Policies for coding_task_logs
CREATE POLICY "Users can view own task logs"
  ON coding_task_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coding_conversations
      WHERE coding_conversations.id = coding_task_logs.conversation_id
      AND coding_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own task logs"
  ON coding_task_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coding_conversations
      WHERE coding_conversations.id = coding_task_logs.conversation_id
      AND coding_conversations.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_coding_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_coding_conversations_timestamp
  BEFORE UPDATE ON coding_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_coding_conversations_updated_at();