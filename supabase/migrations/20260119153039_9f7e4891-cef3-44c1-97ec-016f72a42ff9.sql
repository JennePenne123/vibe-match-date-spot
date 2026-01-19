-- Add home location fields to user_preferences table for persistent location storage
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS home_latitude NUMERIC(10, 7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS home_longitude NUMERIC(11, 7) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS home_address TEXT DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.user_preferences.home_latitude IS 'User home/default latitude for venue searches';
COMMENT ON COLUMN public.user_preferences.home_longitude IS 'User home/default longitude for venue searches';
COMMENT ON COLUMN public.user_preferences.home_address IS 'User home/default address display name';

-- Add constraint to ensure valid coordinates when provided
ALTER TABLE public.user_preferences
ADD CONSTRAINT valid_home_coordinates CHECK (
  (home_latitude IS NULL AND home_longitude IS NULL) OR
  (home_latitude IS NOT NULL AND home_longitude IS NOT NULL AND
   home_latitude >= -90 AND home_latitude <= 90 AND
   home_longitude >= -180 AND home_longitude <= 180)
);