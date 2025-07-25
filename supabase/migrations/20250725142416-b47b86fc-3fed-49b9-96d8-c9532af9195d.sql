-- Add photos column to venues table to store Google Places photos
ALTER TABLE public.venues 
ADD COLUMN photos JSONB DEFAULT '[]'::jsonb;