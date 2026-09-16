INSERT INTO public.venue_import_jobs (city, country, latitude, longitude, radius_km, category, priority, status)
SELECT c.city, c.country, c.latitude, c.longitude, c.radius_km, cat.category, 10, 'pending'
FROM (
  VALUES
    ('New York', 'US', 40.7128, -74.0060, 15),
    ('Los Angeles', 'US', 34.0522, -118.2437, 25)
) AS c(city, country, latitude, longitude, radius_km)
CROSS JOIN (
  VALUES ('food'), ('culture'), ('activity'), ('nightlife'), ('wellness'), ('outdoor'), ('sport_action')
) AS cat(category);