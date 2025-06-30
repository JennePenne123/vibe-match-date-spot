
-- Create friendships table for managing friend relationships
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Create venues table for storing venue information
CREATE TABLE public.venues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  website TEXT,
  cuisine_type TEXT,
  price_range TEXT CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),
  image_url TEXT,
  google_place_id TEXT UNIQUE,
  opening_hours JSONB,
  tags TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create date_invitations table for managing date invites
CREATE TABLE public.date_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT,
  proposed_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_preferences table for storing user dating preferences
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  preferred_cuisines TEXT[],
  preferred_vibes TEXT[],
  preferred_price_range TEXT[],
  max_distance INTEGER, -- in miles
  preferred_times TEXT[], -- e.g., ['morning', 'afternoon', 'evening']
  dietary_restrictions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.date_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friendships table
CREATE POLICY "Users can view their own friendships" 
  ON public.friendships 
  FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships" 
  ON public.friendships 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own friendships" 
  ON public.friendships 
  FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- RLS Policies for venues table (public read, authenticated write)
CREATE POLICY "Anyone can view active venues" 
  ON public.venues 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Authenticated users can create venues" 
  ON public.venues 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for date_invitations table
CREATE POLICY "Users can view their own date invitations" 
  ON public.date_invitations 
  FOR SELECT 
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create date invitations" 
  ON public.date_invitations 
  FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own date invitations" 
  ON public.date_invitations 
  FOR UPDATE 
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- RLS Policies for user_preferences table
CREATE POLICY "Users can view their own preferences" 
  ON public.user_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences" 
  ON public.user_preferences 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
  ON public.user_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);
CREATE INDEX idx_venues_location ON public.venues(latitude, longitude);
CREATE INDEX idx_venues_cuisine_type ON public.venues(cuisine_type);
CREATE INDEX idx_venues_price_range ON public.venues(price_range);
CREATE INDEX idx_date_invitations_sender ON public.date_invitations(sender_id);
CREATE INDEX idx_date_invitations_recipient ON public.date_invitations(recipient_id);
CREATE INDEX idx_date_invitations_status ON public.date_invitations(status);
CREATE INDEX idx_user_preferences_user ON public.user_preferences(user_id);

-- Insert some sample venues to replace mock data
INSERT INTO public.venues (name, description, address, cuisine_type, price_range, rating, image_url, tags) VALUES
('Bella Notte', 'Authentic Italian restaurant with romantic ambiance and handmade pasta', '123 Main St, Downtown', 'Italian', '$$$', 4.8, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop', ARRAY['romantic', 'pasta', 'wine', 'date night']),
('Sakura Sushi', 'Fresh sushi and sashimi in a modern Japanese setting', '456 Oak Ave, Arts District', 'Japanese', '$$', 4.6, 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=300&fit=crop', ARRAY['sushi', 'fresh', 'modern', 'healthy']),
('Taco Libre', 'Vibrant Mexican cantina with craft cocktails and street tacos', '789 Pine St, Mission District', 'Mexican', '$$', 4.4, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop', ARRAY['tacos', 'cocktails', 'lively', 'outdoor seating']);
