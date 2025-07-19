-- Remove foreign key constraint and change venue_id to TEXT
-- since venues from Google Places API have custom IDs, not UUIDs

-- First, drop the foreign key constraint if it exists
ALTER TABLE public.date_invitations 
DROP CONSTRAINT IF EXISTS date_invitations_venue_id_fkey;

-- Then change the column type to TEXT
ALTER TABLE public.date_invitations 
ALTER COLUMN venue_id TYPE TEXT;

-- Also update venues table id to TEXT for consistency
ALTER TABLE public.venues
DROP CONSTRAINT IF EXISTS venues_pkey;

ALTER TABLE public.venues 
ALTER COLUMN id TYPE TEXT;

-- Add back primary key constraint
ALTER TABLE public.venues 
ADD PRIMARY KEY (id);

-- Update planning sessions table as well
ALTER TABLE public.date_planning_sessions
ALTER COLUMN selected_venue_id TYPE TEXT;