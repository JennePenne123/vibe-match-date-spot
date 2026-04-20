-- Reactivate culture/activity venues that were previously imported as inactive
-- "for future activities feature" — that future is now: the situational
-- Quick-Action picker (Kultur/Aktivität/Nightlife) needs these venues to
-- have something to recommend.
UPDATE public.venues
SET is_active = true,
    updated_at = NOW()
WHERE is_active = false
  AND (
    LOWER(cuisine_type) IN ('museum','theater','theatre','cinema','bowling','nightclub','swimming','spa & wellness','spa','mini golf')
    OR LOWER(cuisine_type) ILIKE '%museum%'
    OR LOWER(cuisine_type) ILIKE '%theat%'
    OR LOWER(cuisine_type) ILIKE '%cinema%'
    OR LOWER(cuisine_type) ILIKE '%bowling%'
    OR LOWER(cuisine_type) ILIKE '%nightclub%'
  );