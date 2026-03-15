
-- Table for exclusive partner-to-partner vouchers generated via QR scan
CREATE TABLE public.partner_exclusive_vouchers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- The partner who offered the voucher (QR code owner)
  offering_partner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- The partner who scanned and received the voucher
  receiving_partner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- The venue of the offering partner
  offering_venue_id text REFERENCES public.venues(id),
  -- Auto-generated discount details
  title text NOT NULL,
  description text,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 15,
  code text NOT NULL DEFAULT upper(substring(md5(random()::text) from 1 for 8)),
  status text NOT NULL DEFAULT 'active',
  redeemed_at timestamptz,
  valid_until timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Prevent duplicate scans between same partner pair for same venue
  UNIQUE (offering_partner_id, receiving_partner_id, offering_venue_id)
);

-- Enable RLS
ALTER TABLE public.partner_exclusive_vouchers ENABLE ROW LEVEL SECURITY;

-- Partners can view vouchers they offered or received
CREATE POLICY "Partners can view their exclusive vouchers"
  ON public.partner_exclusive_vouchers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = offering_partner_id OR auth.uid() = receiving_partner_id);

-- Only authenticated partners can insert (will be validated in app code for role)
CREATE POLICY "Partners can create exclusive vouchers"
  ON public.partner_exclusive_vouchers
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = receiving_partner_id);

-- Partners can update their own received vouchers (e.g., redeem)
CREATE POLICY "Partners can update received vouchers"
  ON public.partner_exclusive_vouchers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiving_partner_id);

-- Deny anonymous
CREATE POLICY "Deny anonymous access"
  ON public.partner_exclusive_vouchers
  FOR ALL
  TO anon
  USING (false);
