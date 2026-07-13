CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'general',
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  admin_notes text,
  contact_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT support_tickets_subject_len CHECK (char_length(subject) BETWEEN 1 AND 200),
  CONSTRAINT support_tickets_message_len CHECK (char_length(message) BETWEEN 1 AND 4000),
  CONSTRAINT support_tickets_category_valid CHECK (category IN ('general','bug','account','payment','partner','feature','other')),
  CONSTRAINT support_tickets_status_valid CHECK (status IN ('open','in_progress','resolved','closed'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can create their own tickets
CREATE POLICY "Users can create own tickets"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own tickets; admins can view all
CREATE POLICY "Users view own tickets, admins view all"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Only admins can update tickets (status / admin_notes)
CREATE POLICY "Admins can update tickets"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete tickets
CREATE POLICY "Admins can delete tickets"
ON public.support_tickets
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);