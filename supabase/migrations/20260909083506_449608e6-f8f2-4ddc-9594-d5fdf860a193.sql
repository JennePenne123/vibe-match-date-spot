CREATE POLICY "Voters can withdraw their own vote"
  ON public.shared_board_votes FOR DELETE
  USING (
    length(voter_key) BETWEEN 8 AND 64
    AND EXISTS (
      SELECT 1 FROM public.shared_boards b
      WHERE b.id = board_id
        AND b.is_active = true
        AND (b.expires_at IS NULL OR b.expires_at > now())
    )
  );