
-- Deactivate venues with invalid names (too short or numeric-only)
UPDATE public.venues SET is_active = false, updated_at = now() WHERE id IN ('osm_849383295', '607f21998a32c47fab62ef31');
