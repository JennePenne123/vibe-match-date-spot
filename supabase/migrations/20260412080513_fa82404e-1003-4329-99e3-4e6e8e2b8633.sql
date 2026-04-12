
-- Create admin_team table for granular internal roles
CREATE TABLE public.admin_team (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_role TEXT NOT NULL DEFAULT 'viewer' CHECK (admin_role IN ('owner', 'tech', 'support', 'moderator', 'viewer')),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.admin_team ENABLE ROW LEVEL SECURITY;

-- Security definer function to check admin_team role without recursion
CREATE OR REPLACE FUNCTION public.is_admin_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_team
    WHERE user_id = _user_id
      AND admin_role = 'owner'
  );
$$;

-- Security definer function to get admin team role
CREATE OR REPLACE FUNCTION public.get_admin_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT admin_role
  FROM public.admin_team
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- Admins can view all team members
CREATE POLICY "Admins can view team"
  ON public.admin_team FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Only owners can insert
CREATE POLICY "Owners can add team members"
  ON public.admin_team FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    AND is_admin_owner(auth.uid())
  );

-- Only owners can update
CREATE POLICY "Owners can update team roles"
  ON public.admin_team FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    AND is_admin_owner(auth.uid())
  );

-- Only owners can delete
CREATE POLICY "Owners can remove team members"
  ON public.admin_team FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    AND is_admin_owner(auth.uid())
  );

-- Indexes
CREATE INDEX idx_admin_team_user ON public.admin_team(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_admin_team_updated_at
  BEFORE UPDATE ON public.admin_team
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed: Set current admins as owners (Lenny & Jan)
-- They need to be inserted after user IDs are known, via admin UI
