
-- 1. Drop broad SELECT policies that enable bucket listing.
--    Public-bucket assets remain reachable via direct URL (no policy needed).
DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view venue photos" ON storage.objects;
DROP POLICY IF EXISTS "Anon can view own folder avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anon can view venue photos via direct access" ON storage.objects;

-- 2. Hide GraphQL schema from anon and authenticated.
--    The app uses PostgREST (REST), not GraphQL — RLS still protects data
--    but we additionally remove schema-discovery surface.
REVOKE USAGE ON SCHEMA graphql FROM anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA graphql FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA graphql FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA graphql FROM anon, authenticated;
