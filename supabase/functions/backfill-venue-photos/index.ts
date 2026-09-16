import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getCachedVenueIds, recordPhotoAttempt } from '../_shared/photo-attempt-cache.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Backfills real Google Places photos for cached venues that don't yet have a
 * google_place_id (typically sourced from OpenStreetMap/Overpass/Radar).
 *
 * For each candidate venue it runs a Google Places Text Search (New API v1)
 * biased to the venue's coordinates, resolves the best matching place_id,
 * pulls up to 5 photos and persists { google_place_id, photos, image_url }.
 *
 * Admin-only. Body: { limit?: number } (max 25 per call to control API cost).
 * Returns: { processed, matched, updated, skipped, remaining }
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GOOGLE_PLACES_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Auth: accept the shared cron token (same store as venue-import-worker) ...
    const earlyAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: control } = await earlyAdmin
      .from('venue_import_control')
      .select('cron_token')
      .eq('id', true)
      .maybeSingle();
    const cronToken = req.headers.get('x-cron-token');
    const cronAuthorized = Boolean(cronToken && control?.cron_token && cronToken === control.cron_token);

    // ... otherwise require an admin caller ---
    const authHeader = req.headers.get('authorization');
    if (!cronAuthorized && !authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!cronAuthorized) {
      const authClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader! } } },
      );
      const token = authHeader!.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const userId = claimsData.claims.sub as string;
      const { data: isAdmin, error: roleErr } = await authClient.rpc('has_role', {
        _user_id: userId,
        _role: 'admin',
      });
      if (roleErr || !isAdmin) {
        return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body?.limit) || 10, 1), 25);
    // Optional: restrict the backfill to specific cuisine_types (e.g. parks).
    const cuisineTypes: string[] = Array.isArray(body?.cuisine_types)
      ? body.cuisine_types.filter((v: unknown) => typeof v === 'string' && v.length > 0).slice(0, 20)
      : [];

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Candidate venues: active, geocoded, without a google_place_id yet.
    let candidatesQuery = admin
      .from('venues')
      .select('id, name, address, latitude, longitude')
      .is('google_place_id', null)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .eq('is_active', true)
      // Over-fetch so cooldown-cached venues can be filtered out client-side.
      .limit(limit * 4);
    if (cuisineTypes.length > 0) {
      candidatesQuery = candidatesQuery.in('cuisine_type', cuisineTypes);
    }
    const { data: pool, error: fetchErr } = await candidatesQuery;

    if (fetchErr) {
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Photo cache: never pay for the same venue twice inside its cooldown.
    const cachedIds = await getCachedVenueIds(
      admin,
      'google',
      (pool || []).map((v: { id: string }) => v.id),
    );
    const fresh = (pool || []).filter((v: { id: string }) => !cachedIds.has(v.id));
    const venues = fresh.slice(0, limit);
    const cacheSkipped = (pool || []).length - fresh.length;

    // Count remaining for progress reporting.
    let remainingQuery = admin
      .from('venues')
      .select('id', { count: 'exact', head: true })
      .is('google_place_id', null)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .eq('is_active', true);
    if (cuisineTypes.length > 0) {
      remainingQuery = remainingQuery.in('cuisine_type', cuisineTypes);
    }
    const { count: remainingBefore } = await remainingQuery;

    const buildPhotoUrl = (name: string, w: number) =>
      `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${w}&key=${apiKey}`;

    let processed = 0;
    let matched = 0;
    let updated = 0;
    let skipped = 0;

    for (const v of venues || []) {
      processed++;
      try {
        const lat = Number(v.latitude);
        const lng = Number(v.longitude);
        const textQuery = [v.name, v.address].filter(Boolean).join(', ');

        const searchRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.id,places.photos,places.location,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.websiteUri,places.nationalPhoneNumber',
          },
          body: JSON.stringify({
            textQuery,
            maxResultCount: 1,
            locationBias: {
              circle: { center: { latitude: lat, longitude: lng }, radius: 500.0 },
            },
          }),
        });

        if (!searchRes.ok) {
          console.warn(`searchText ${searchRes.status} for ${v.id}`);
          await recordPhotoAttempt(admin, {
            venueId: v.id,
            source: 'google',
            status: 'error',
            message: `searchText ${searchRes.status}`,
          });
          skipped++;
          continue;
        }

        const searchJson = await searchRes.json();
        const place = searchJson.places?.[0];
        if (!place?.id) {
          await recordPhotoAttempt(admin, { venueId: v.id, source: 'google', status: 'miss' });
          skipped++;
          continue;
        }
        matched++;

        const photoRefs: any[] = (place.photos || []).slice(0, 5);
        const photos = photoRefs.map((p: any, i: number) => ({
          url: buildPhotoUrl(p.name, i === 0 ? 800 : 400),
          thumbnail: buildPhotoUrl(p.name, 200),
          width: p.widthPx || 400,
          height: p.heightPx || 300,
          attribution: p.authorAttributions?.[0]?.displayName || 'Google',
          isGooglePhoto: true,
        }));

        const updatePayload: Record<string, unknown> = {
          google_place_id: place.id,
          updated_at: new Date().toISOString(),
        };
        if (photos.length > 0) {
          updatePayload.photos = photos;
          updatePayload.image_url = photos[0].url;
        }
        const googleAddr = place.shortFormattedAddress || place.formattedAddress;
        if (googleAddr && typeof googleAddr === 'string' && googleAddr.trim().length > 0) {
          updatePayload.address = googleAddr;
        }
        if (place.websiteUri) updatePayload.website = place.websiteUri;
        if (place.nationalPhoneNumber) updatePayload.phone = place.nationalPhoneNumber;

        const { error: updateErr } = await admin
          .from('venues')
          .update(updatePayload)
          .eq('id', v.id);

        if (updateErr) {
          console.error(`Update error for ${v.id}:`, updateErr);
          await recordPhotoAttempt(admin, {
            venueId: v.id,
            source: 'google',
            status: 'error',
            message: updateErr.message,
          });
          skipped++;
        } else {
          await recordPhotoAttempt(admin, {
            venueId: v.id,
            source: 'google',
            status: photos.length > 0 ? 'hit' : 'miss',
            photoCount: photos.length,
          });
          updated++;
        }
      } catch (err) {
        console.error(`Backfill error for ${v.id}:`, err);
        await recordPhotoAttempt(admin, {
          venueId: v.id,
          source: 'google',
          status: 'error',
          message: String(err),
        });
        skipped++;
      }
    }

    const remaining = Math.max((remainingBefore || 0) - matched, 0);

    return new Response(
      JSON.stringify({ processed, matched, updated, skipped, cacheSkipped, remaining }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('backfill-venue-photos fatal:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
