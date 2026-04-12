
-- Add data quality tracking fields to venues
ALTER TABLE public.venues
ADD COLUMN IF NOT EXISTS data_quality_score numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS data_quality_issues jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_validated_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS nominatim_match_name text DEFAULT NULL;

-- Index for finding unvalidated venues
CREATE INDEX IF NOT EXISTS idx_venues_last_validated ON public.venues (last_validated_at NULLS FIRST) WHERE is_active = true;
