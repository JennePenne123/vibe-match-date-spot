-- Fix empty price ranges for existing users
UPDATE user_preferences 
SET preferred_price_range = ARRAY['$$']
WHERE preferred_price_range IS NULL OR array_length(preferred_price_range, 1) IS NULL;

-- Set default price range for new users
ALTER TABLE user_preferences 
ALTER COLUMN preferred_price_range SET DEFAULT ARRAY['$$'];