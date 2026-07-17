
-- date_group_members: prevent role/ownership self-change
DROP POLICY IF EXISTS "Members can update own membership" ON public.date_group_members;
CREATE POLICY "Members can update own membership"
ON public.date_group_members
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid()
  AND role = (SELECT role FROM public.date_group_members d WHERE d.id = date_group_members.id)
  AND group_id = (SELECT group_id FROM public.date_group_members d WHERE d.id = date_group_members.id)
);

-- date_groups: creator cannot reassign creator_id
DROP POLICY IF EXISTS "Creator can update groups" ON public.date_groups;
CREATE POLICY "Creator can update groups"
ON public.date_groups
FOR UPDATE
USING (creator_id = auth.uid())
WITH CHECK (creator_id = auth.uid());

-- date_invitations: keep sender/recipient stable
DROP POLICY IF EXISTS "Users can update their own date invitations" ON public.date_invitations;
CREATE POLICY "Users can update their own date invitations"
ON public.date_invitations
FOR UPDATE
USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id))
WITH CHECK ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));

-- date_proposals: keep proposer/recipient stable
DROP POLICY IF EXISTS "Recipients can update proposal status" ON public.date_proposals;
CREATE POLICY "Recipients can update proposal status"
ON public.date_proposals
FOR UPDATE
USING ((auth.uid() = recipient_id) OR (auth.uid() = proposer_id))
WITH CHECK ((auth.uid() = recipient_id) OR (auth.uid() = proposer_id));

-- partner_exclusive_vouchers: receiver cannot change ownership or discount fields
DROP POLICY IF EXISTS "Partners can update received vouchers" ON public.partner_exclusive_vouchers;
CREATE POLICY "Partners can update received vouchers"
ON public.partner_exclusive_vouchers
FOR UPDATE
USING (auth.uid() = receiving_partner_id)
WITH CHECK (
  auth.uid() = receiving_partner_id
  AND receiving_partner_id = (SELECT receiving_partner_id FROM public.partner_exclusive_vouchers v WHERE v.id = partner_exclusive_vouchers.id)
  AND offering_partner_id = (SELECT offering_partner_id FROM public.partner_exclusive_vouchers v WHERE v.id = partner_exclusive_vouchers.id)
  AND discount_value = (SELECT discount_value FROM public.partner_exclusive_vouchers v WHERE v.id = partner_exclusive_vouchers.id)
);
