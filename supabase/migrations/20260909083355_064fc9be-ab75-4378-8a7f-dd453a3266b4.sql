CREATE TABLE public.shared_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL,
  title TEXT NOT NULL,
  city TEXT,
  note TEXT,
  venues JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_shared_boards_owner ON public.shared_boards(owner_id);
CREATE INDEX idx_shared_boards_slug ON public.shared_boards(slug);

GRANT SELECT ON public.shared_boards TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_boards TO authenticated;
GRANT ALL ON public.shared_boards TO service_role;

ALTER TABLE public.shared_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone with the link can view active boards"
  ON public.shared_boards FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Owners can view their own boards"
  ON public.shared_boards FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can create boards"
  ON public.shared_boards FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update their boards"
  ON public.shared_boards FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can delete their boards"
  ON public.shared_boards FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE TABLE public.shared_board_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.shared_boards(id) ON DELETE CASCADE,
  venue_key TEXT NOT NULL,
  voter_key TEXT NOT NULL,
  voter_name TEXT,
  vote SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (board_id, venue_key, voter_key)
);

CREATE INDEX idx_shared_board_votes_board ON public.shared_board_votes(board_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_board_votes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_board_votes TO authenticated;
GRANT ALL ON public.shared_board_votes TO service_role;

ALTER TABLE public.shared_board_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes on visible boards are public"
  ON public.shared_board_votes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.shared_boards b
    WHERE b.id = board_id
      AND b.is_active = true
      AND (b.expires_at IS NULL OR b.expires_at > now())
  ));

CREATE POLICY "Guests can vote on visible boards"
  ON public.shared_board_votes FOR INSERT
  WITH CHECK (
    length(voter_key) BETWEEN 8 AND 64
    AND length(venue_key) BETWEEN 1 AND 200
    AND (voter_name IS NULL OR length(voter_name) <= 40)
    AND vote IN (-1, 1)
    AND EXISTS (
      SELECT 1 FROM public.shared_boards b
      WHERE b.id = board_id
        AND b.is_active = true
        AND (b.expires_at IS NULL OR b.expires_at > now())
    )
  );

CREATE POLICY "Board owners can clear votes"
  ON public.shared_board_votes FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.shared_boards b
    WHERE b.id = board_id AND b.owner_id = auth.uid()
  ));

CREATE OR REPLACE FUNCTION public.set_shared_board_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_shared_boards_updated_at
  BEFORE UPDATE ON public.shared_boards
  FOR EACH ROW EXECUTE FUNCTION public.set_shared_board_updated_at();

CREATE OR REPLACE FUNCTION public.increment_shared_board_view(_slug TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.shared_boards
  SET view_count = view_count + 1
  WHERE slug = _slug
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now());
$$;

REVOKE ALL ON FUNCTION public.increment_shared_board_view(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_shared_board_view(TEXT) TO anon, authenticated;