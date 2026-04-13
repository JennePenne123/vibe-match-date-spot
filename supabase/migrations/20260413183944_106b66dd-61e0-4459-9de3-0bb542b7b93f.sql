-- Grant table-level INSERT to anon on waitlist_signups
GRANT INSERT ON TABLE public.waitlist_signups TO anon;

-- Also ensure anon can use sequences (for default id generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;