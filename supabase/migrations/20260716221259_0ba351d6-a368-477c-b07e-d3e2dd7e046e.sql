DROP POLICY IF EXISTS "Creator can add members" ON public.date_group_members;
CREATE POLICY "Creator can add members"
ON public.date_group_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.date_groups
    WHERE date_groups.id = date_group_members.group_id
      AND date_groups.creator_id = auth.uid()
  )
);