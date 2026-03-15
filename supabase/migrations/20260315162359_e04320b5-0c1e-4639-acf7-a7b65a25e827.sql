-- Allow venue partners to discover other approved partnerships for the network map
CREATE POLICY "Venue partners can discover other partners"
  ON public.venue_partnerships
  FOR SELECT
  TO authenticated
  USING (
    status = 'approved' 
    AND public.has_role(auth.uid(), 'venue_partner')
  );