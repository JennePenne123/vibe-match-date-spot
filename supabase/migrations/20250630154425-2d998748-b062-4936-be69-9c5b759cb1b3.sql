
-- Enable real-time updates for the date_invitations table
ALTER TABLE public.date_invitations REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.date_invitations;
