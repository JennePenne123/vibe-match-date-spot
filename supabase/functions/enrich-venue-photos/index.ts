import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { verifyUserAuth, unauthorizedResponse } from '../_shared/auth-guards.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Enriches venues with real photos from Google Places API.
 * Only processes venues that have a google_place_id and currently no photos.
 *
 * Body: { venue_ids: string[] } — at most 10 venue ids
 * Returns: { enriched: number, skipped: number }
 *
 * Designed to be called fire-and-forget from the frontend after recommendations
 * are returned. Caches photos in venues.photos + image_url so subsequent
 * sessions show real imagery without API calls.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const auth = await verifyUserAuth(req);
  if (!auth) {
    console.warn('[enrich-venue-photos] Unauthorized invocation');
    return unauthorizedResponse(corsHeaders);
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GOOGLE_PLACES_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const venueIds: string[] = Array.isArray(body?.venue_ids)
      ? body.venue_ids.filter((v: unknown) => typeof v === 'string').slice(0, 10)
      : [];

    if (venueIds.length === 0) {
      return new Response(JSON.stringify({ enriched: 0, skipped: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Fetch candidate venues that have google_place_id and no/empty photos
    const { data: venues, error: fetchErr } = await supabase
      .from('venues')
      .select('id, google_place_id, photos, image_url')
      .in('id', venueIds)
      .not('google_place_id', 'is', null);

    if (fetchErr) {
      console.error('Fetch error:', fetchErr);
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let enriched = 0;
    let skipped = 0;

    for (const v of venues || []) {
      const hasPhotos = Array.isArray(v.photos) && v.photos.length > 0;
      if (hasPhotos && v.image_url) {
        skipped++;
        continue;
      }

      try {
        // Google Places Details (New API v1)
        const detailsRes = await fetch(
          `https://places.googleapis.com/v1/places/${v.google_place_id}`,
          {
            headers: {
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'photos',
            },
          },
        );

        if (!detailsRes.ok) {
          console.warn(`Places API ${detailsRes.status} for ${v.id}`);
          skipped++;
          continue;
        }

        const details = await detailsRes.json();
        const photoRefs: any[] = (details.photos || []).slice(0, 5);

        if (photoRefs.length === 0) {
          skipped++;
          continue;
        }

        const buildUrl = (name: string, w: number) =>
          `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${w}&key=${apiKey}`;

        const photos = photoRefs.map((p: any, i: number) => ({
          url: buildUrl(p.name, i === 0 ? 800 : 400),
          thumbnail: buildUrl(p.name, 200),
          width: p.widthPx || 400,
          height: p.heightPx || 300,
          attribution: p.authorAttributions?.[0]?.displayName || 'Google',
          isGooglePhoto: true,
        }));

        const { error: updateErr } = await supabase
          .from('venues')
          .update({
            photos,
            image_url: photos[0].url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', v.id);

        if (updateErr) {
          console.error(`Update error for ${v.id}:`, updateErr);
          skipped++;
        } else {
          enriched++;
        }
      } catch (err) {
        console.error(`Enrich error for ${v.id}:`, err);
        skipped++;
      }
    }

    return new Response(JSON.stringify({ enriched, skipped }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('enrich-venue-photos fatal:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
