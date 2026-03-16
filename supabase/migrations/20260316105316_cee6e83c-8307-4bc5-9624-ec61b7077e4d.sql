
CREATE TABLE public.partner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  business_name text NOT NULL DEFAULT '',
  contact_person text NOT NULL DEFAULT '',
  business_email text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  website text DEFAULT '',
  description text DEFAULT '',
  logo_url text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  postal_code text DEFAULT '',
  country text DEFAULT 'DE',
  tax_id text DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

-- Partners can view their own profile
CREATE POLICY "Partners can view own profile"
  ON public.partner_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Partners can insert their own profile
CREATE POLICY "Partners can insert own profile"
  ON public.partner_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_role(auth.uid(), 'venue_partner'));

-- Partners can update their own profile
CREATE POLICY "Partners can update own profile"
  ON public.partner_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all profiles
CREATE POLICY "Admins can manage partner profiles"
  ON public.partner_profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to partner profiles"
  ON public.partner_profiles FOR ALL
  TO anon
  USING (false);
