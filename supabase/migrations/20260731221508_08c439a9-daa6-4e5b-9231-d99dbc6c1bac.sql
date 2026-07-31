ALTER TABLE public.date_groups
  ADD COLUMN IF NOT EXISTS invite_token text UNIQUE DEFAULT encode(gen_random_bytes(9), 'hex');

UPDATE public.date_groups SET invite_token = encode(gen_random_bytes(9), 'hex') WHERE invite_token IS NULL;

CREATE OR REPLACE FUNCTION public.get_group_invite_preview(_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g record;
  member_count integer;
  already boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO g FROM public.date_groups WHERE invite_token = _token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT count(*) INTO member_count
  FROM public.date_group_members
  WHERE group_id = g.id AND invitation_status <> 'declined';

  SELECT EXISTS (
    SELECT 1 FROM public.date_group_members
    WHERE group_id = g.id AND user_id = auth.uid()
  ) INTO already;

  RETURN jsonb_build_object(
    'found', true,
    'group_id', g.id,
    'name', g.name,
    'status', g.status,
    'max_members', g.max_members,
    'member_count', member_count,
    'already_member', already
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.join_group_via_invite(_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  g record;
  member_count integer;
  existing record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO g FROM public.date_groups WHERE invite_token = _token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF g.status IN ('cancelled', 'completed') THEN
    RETURN jsonb_build_object('success', false, 'reason', 'closed');
  END IF;

  SELECT * INTO existing FROM public.date_group_members
  WHERE group_id = g.id AND user_id = auth.uid();

  IF FOUND THEN
    UPDATE public.date_group_members
    SET invitation_status = 'accepted',
        joined_at = COALESCE(joined_at, now()),
        updated_at = now()
    WHERE id = existing.id;
    RETURN jsonb_build_object('success', true, 'group_id', g.id, 'already_member', true);
  END IF;

  SELECT count(*) INTO member_count
  FROM public.date_group_members
  WHERE group_id = g.id AND invitation_status <> 'declined';

  IF member_count >= g.max_members THEN
    RETURN jsonb_build_object('success', false, 'reason', 'full');
  END IF;

  INSERT INTO public.date_group_members (group_id, user_id, role, invitation_status, joined_at)
  VALUES (g.id, auth.uid(), 'member', 'accepted', now());

  RETURN jsonb_build_object('success', true, 'group_id', g.id, 'already_member', false);
END;
$$;

REVOKE ALL ON FUNCTION public.get_group_invite_preview(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.join_group_via_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_group_invite_preview(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.join_group_via_invite(text) TO authenticated, service_role;