-- Fix venue_id column type to accept text instead of UUID
-- since venues from Google Places API have custom IDs, not UUIDs

ALTER TABLE public.date_invitations 
ALTER COLUMN venue_id TYPE TEXT;