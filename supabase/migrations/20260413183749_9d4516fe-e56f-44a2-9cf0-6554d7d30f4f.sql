-- Grant anon role access to insert into waitlist_signups
GRANT INSERT ON public.waitlist_signups TO anon;

-- Also need usage on the schema
GRANT USAGE ON SCHEMA public TO anon;