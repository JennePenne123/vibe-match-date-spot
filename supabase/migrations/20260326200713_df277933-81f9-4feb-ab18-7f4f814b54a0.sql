
-- Add venue personality/detail columns for better AI matching
ALTER TABLE public.venues 
  ADD COLUMN IF NOT EXISTS best_times jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS capacity integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_separee boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pair_friendly_features text[] DEFAULT NULL;

-- best_times structure: { "romantic": ["friday_evening", "saturday_evening"], "quiet": ["tuesday_lunch", "wednesday_lunch"], "lively": ["friday_night", "saturday_night"] }
-- pair_friendly_features: ["candle_lit_tables", "corner_seats", "garden_table_for_two", etc.]

COMMENT ON COLUMN public.venues.best_times IS 'JSON with time slots by mood: romantic, quiet, lively';
COMMENT ON COLUMN public.venues.capacity IS 'Maximum seating capacity';
COMMENT ON COLUMN public.venues.has_separee IS 'Whether private dining/separee is available';
COMMENT ON COLUMN public.venues.pair_friendly_features IS 'Features especially suited for couples';
