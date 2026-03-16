
-- Allow partners to read feedback for invitations at their venues
CREATE POLICY "Partners can view feedback for their venues"
ON public.date_feedback
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM date_invitations di
    JOIN venue_partnerships vp ON vp.venue_id = di.venue_id
    WHERE di.id = date_feedback.invitation_id
      AND vp.partner_id = auth.uid()
      AND vp.status = 'approved'
  )
);
