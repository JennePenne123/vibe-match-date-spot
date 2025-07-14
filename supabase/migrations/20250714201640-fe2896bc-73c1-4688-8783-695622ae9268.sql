-- Add some Italian restaurants in Hamburg for testing
INSERT INTO public.venues (name, address, cuisine_type, price_range, rating, latitude, longitude, description, is_active) VALUES 
('Ristorante Bellini', 'Neuer Wall 40, 20354 Hamburg, Germany', 'Italian', '$$', 4.5, 53.5511, 9.9937, 'Authentic Italian cuisine in the heart of Hamburg', true),
('La Pasta', 'Große Bleichen 23, 20354 Hamburg, Germany', 'Italian', '$$', 4.2, 53.5545, 9.9928, 'Fresh pasta and traditional Italian dishes', true),
('Villa Medici', 'Rothenbaumchaussee 109, 20148 Hamburg, Germany', 'Italian', '$$$', 4.7, 53.5735, 9.9920, 'Upscale Italian dining with romantic atmosphere', true),
('Osteria del Borgo', 'Schulterblatt 12, 20357 Hamburg, Germany', 'Italian', '$$', 4.3, 53.5588, 9.9647, 'Cozy Italian bistro in Schanzenviertel', true),
('Mama Mia Pizzeria', 'Lange Reihe 68, 20099 Hamburg, Germany', 'Italian', '$', 4.1, 53.5536, 10.0063, 'Casual Italian pizzeria with great atmosphere', true)
ON CONFLICT (google_place_id) DO NOTHING;