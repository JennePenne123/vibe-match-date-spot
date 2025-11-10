-- Add Foursquare support to venues table
ALTER TABLE venues
ADD COLUMN IF NOT EXISTS foursquare_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS foursquare_data JSONB;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_venues_foursquare_id ON venues(foursquare_id);

-- Add comments for documentation
COMMENT ON COLUMN venues.foursquare_id IS 'Foursquare FSQ ID for the venue';
COMMENT ON COLUMN venues.foursquare_data IS 'Additional Foursquare-specific data (tips, stats, categories, etc)';