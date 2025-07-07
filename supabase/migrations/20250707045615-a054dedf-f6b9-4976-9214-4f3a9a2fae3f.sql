
-- Add latitude/longitude coordinates to existing venues for proper location-based scoring
UPDATE public.venues 
SET latitude = 40.7589, longitude = -73.9851 
WHERE name = 'Bella Notte';

UPDATE public.venues 
SET latitude = 40.7505, longitude = -73.9934 
WHERE name = 'Sakura Sushi';

UPDATE public.venues 
SET latitude = 40.7614, longitude = -73.9776 
WHERE name = 'Taco Libre';

UPDATE public.venues 
SET latitude = 40.7580, longitude = -73.9855 
WHERE name = 'Urban Bistro';

UPDATE public.venues 
SET latitude = 40.7549, longitude = -73.9840 
WHERE name = 'The Coffee Corner';

-- Add some additional sample venues with coordinates for better AI recommendations
INSERT INTO public.venues (name, address, cuisine_type, price_range, rating, latitude, longitude, tags, is_active, description)
VALUES 
  ('Romantic Garden', '123 Park Ave, New York, NY', 'French', '$$$', 4.5, 40.7505, -73.9773, ARRAY['romantic', 'intimate', 'outdoor'], true, 'Beautiful garden setting perfect for romantic dates'),
  ('Sports Bar Central', '456 Broadway, New York, NY', 'American', '$$', 4.2, 40.7580, -73.9855, ARRAY['casual', 'sports', 'lively'], true, 'Great spot for watching games and casual dining'),
  ('Zen Tea House', '789 East Village, New York, NY', 'Asian', '$', 4.7, 40.7282, -73.9942, ARRAY['quiet', 'peaceful', 'healthy'], true, 'Tranquil atmosphere with premium teas and light meals');
