-- Group dates table for multi-user date planning (max 6 members)
CREATE TABLE public.date_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  planning_session_id uuid REFERENCES public.date_planning_sessions(id) ON DELETE SET NULL,
  venue_id text,
  proposed_date timestamptz,
  max_members integer NOT NULL DEFAULT 6,
  status text NOT NULL DEFAULT 'planning',
  group_compatibility_score numeric DEFAULT 0,
  merged_preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Group members table
CREATE TABLE public.date_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.date_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  invitation_status text NOT NULL DEFAULT 'pending',
  preferences_submitted boolean NOT NULL DEFAULT false,
  preferences_data jsonb DEFAULT '{}'::jsonb,
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- Group messages table for group chat
CREATE TABLE public.date_group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.date_groups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  read_by uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_date_groups_creator ON public.date_groups(creator_id);
CREATE INDEX idx_date_groups_status ON public.date_groups(status);
CREATE INDEX idx_date_group_members_group ON public.date_group_members(group_id);
CREATE INDEX idx_date_group_members_user ON public.date_group_members(user_id);
CREATE INDEX idx_date_group_messages_group ON public.date_group_messages(group_id);
CREATE INDEX idx_date_group_messages_created ON public.date_group_messages(created_at);

-- Enable RLS
ALTER TABLE public.date_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_group_messages ENABLE ROW LEVEL SECURITY;

-- RLS for date_groups: members can view, creator can manage
CREATE POLICY "Members can view their groups"
  ON public.date_groups FOR SELECT TO authenticated
  USING (
    creator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.date_group_members
      WHERE group_id = date_groups.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Creator can insert groups"
  ON public.date_groups FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creator can update groups"
  ON public.date_groups FOR UPDATE TO authenticated
  USING (creator_id = auth.uid());

-- RLS for date_group_members
CREATE POLICY "Members can view group members"
  ON public.date_group_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.date_group_members AS m2
      WHERE m2.group_id = date_group_members.group_id AND m2.user_id = auth.uid()
    )
  );

CREATE POLICY "Creator can add members"
  ON public.date_group_members FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.date_groups
      WHERE id = date_group_members.group_id AND creator_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Members can update own membership"
  ON public.date_group_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- RLS for date_group_messages
CREATE POLICY "Group members can view messages"
  ON public.date_group_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.date_group_members
      WHERE group_id = date_group_messages.group_id AND user_id = auth.uid()
      AND invitation_status = 'accepted'
    )
  );

CREATE POLICY "Group members can send messages"
  ON public.date_group_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.date_group_members
      WHERE group_id = date_group_messages.group_id AND user_id = auth.uid()
      AND invitation_status = 'accepted'
    )
  );

-- Updated_at triggers
CREATE TRIGGER update_date_groups_updated_at
  BEFORE UPDATE ON public.date_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_date_group_members_updated_at
  BEFORE UPDATE ON public.date_group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();