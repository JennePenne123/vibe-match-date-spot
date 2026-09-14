REVOKE ALL ON FUNCTION public.merge_duplicate_venues() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.merge_duplicate_venues() FROM anon;
REVOKE ALL ON FUNCTION public.merge_duplicate_venues() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.merge_duplicate_venues() TO service_role;

REVOKE ALL ON FUNCTION public.set_venue_dedupe_key() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_venue_dedupe_key() FROM anon;
REVOKE ALL ON FUNCTION public.set_venue_dedupe_key() FROM authenticated;