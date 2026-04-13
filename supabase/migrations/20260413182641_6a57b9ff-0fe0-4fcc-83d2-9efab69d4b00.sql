
-- Waitlist signups table
CREATE TABLE public.waitlist_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Anyone can sign up (no auth required)
CREATE POLICY "Anyone can insert waitlist signups"
ON public.waitlist_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view signups
CREATE POLICY "Admins can view waitlist signups"
ON public.waitlist_signups
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete signups
CREATE POLICY "Admins can delete waitlist signups"
ON public.waitlist_signups
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
