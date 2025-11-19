-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('regular', 'venue_partner', 'admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'regular',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create venue_partnerships table
CREATE TABLE public.venue_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  venue_id TEXT REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(partner_id, venue_id)
);

-- Enable RLS on venue_partnerships
ALTER TABLE public.venue_partnerships ENABLE ROW LEVEL SECURITY;

-- RLS policies for venue_partnerships
CREATE POLICY "Partners can view their own partnerships"
  ON public.venue_partnerships
  FOR SELECT
  USING (auth.uid() = partner_id);

CREATE POLICY "Partners can create partnership requests"
  ON public.venue_partnerships
  FOR INSERT
  WITH CHECK (auth.uid() = partner_id AND status = 'pending');

CREATE POLICY "Admins can manage all partnerships"
  ON public.venue_partnerships
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create vouchers table
CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id TEXT REFERENCES public.venues(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_item')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  max_redemptions INTEGER,
  current_redemptions INTEGER NOT NULL DEFAULT 0,
  min_booking_value NUMERIC,
  applicable_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  applicable_times TEXT[] DEFAULT ARRAY['breakfast', 'lunch', 'dinner', 'late_night'],
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'suspended')),
  terms_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vouchers
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- RLS policies for vouchers
CREATE POLICY "Anyone can view active vouchers"
  ON public.vouchers
  FOR SELECT
  USING (status = 'active' AND valid_until > now());

CREATE POLICY "Partners can manage their venue vouchers"
  ON public.vouchers
  FOR ALL
  USING (
    auth.uid() = partner_id 
    AND EXISTS (
      SELECT 1 FROM public.venue_partnerships
      WHERE venue_partnerships.partner_id = auth.uid()
        AND venue_partnerships.venue_id = vouchers.venue_id
        AND venue_partnerships.status = 'active'
    )
  );

-- Create voucher_redemptions table
CREATE TABLE public.voucher_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID REFERENCES public.vouchers(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invitation_id UUID REFERENCES public.date_invitations(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  discount_applied NUMERIC NOT NULL,
  booking_value NUMERIC,
  status TEXT NOT NULL DEFAULT 'redeemed' CHECK (status IN ('claimed', 'redeemed', 'expired', 'cancelled')),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on voucher_redemptions
ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for voucher_redemptions
CREATE POLICY "Users can view their own redemptions"
  ON public.voucher_redemptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create redemptions"
  ON public.voucher_redemptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Partners can view redemptions for their vouchers"
  ON public.voucher_redemptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vouchers
      WHERE vouchers.id = voucher_redemptions.voucher_id
        AND vouchers.partner_id = auth.uid()
    )
  );

-- Create trigger to update voucher redemption count
CREATE OR REPLACE FUNCTION public.increment_voucher_redemptions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vouchers
  SET current_redemptions = current_redemptions + 1
  WHERE id = NEW.voucher_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_voucher_redeemed
  AFTER INSERT ON public.voucher_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_voucher_redemptions();

-- Create trigger to automatically assign regular role to new users
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'regular')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_role();

-- Create updated_at trigger for venue_partnerships
CREATE TRIGGER update_venue_partnerships_updated_at
  BEFORE UPDATE ON public.venue_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for vouchers
CREATE TRIGGER update_vouchers_updated_at
  BEFORE UPDATE ON public.vouchers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();