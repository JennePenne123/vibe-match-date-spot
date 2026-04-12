
-- Create venue_staff table for employee management
CREATE TABLE public.venue_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id UUID NOT NULL,
  venue_id TEXT NULL,
  user_id UUID NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  staff_role TEXT NOT NULL DEFAULT 'staff' CHECK (staff_role IN ('manager', 'staff')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'deactivated')),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE NULL,
  qr_code_token TEXT NOT NULL DEFAULT upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 16)),
  last_scan_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (partner_id, email)
);

-- Index for fast lookups
CREATE INDEX idx_venue_staff_partner ON public.venue_staff(partner_id);
CREATE INDEX idx_venue_staff_user ON public.venue_staff(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_venue_staff_qr_token ON public.venue_staff(qr_code_token);

-- Enable RLS
ALTER TABLE public.venue_staff ENABLE ROW LEVEL SECURITY;

-- Partners can view their own staff
CREATE POLICY "Partners can view their staff"
ON public.venue_staff FOR SELECT
TO authenticated
USING (
  partner_id = auth.uid()
  OR user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Partners can add staff
CREATE POLICY "Partners can add staff"
ON public.venue_staff FOR INSERT
TO authenticated
WITH CHECK (
  partner_id = auth.uid()
  AND has_role(auth.uid(), 'venue_partner'::app_role)
);

-- Partners can update their staff (or staff can update own record)
CREATE POLICY "Partners can update staff"
ON public.venue_staff FOR UPDATE
TO authenticated
USING (
  partner_id = auth.uid()
  OR user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Partners can delete their staff
CREATE POLICY "Partners can delete staff"
ON public.venue_staff FOR DELETE
TO authenticated
USING (
  partner_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger for updated_at
CREATE TRIGGER update_venue_staff_updated_at
BEFORE UPDATE ON public.venue_staff
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Revoke anon access
REVOKE ALL ON public.venue_staff FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
