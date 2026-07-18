import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { requireCronOrAdmin, unauthorizedResponse } from '../_shared/auth-guards.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Monthly maintenance job (cron):
 * 1) Refresh existing venues that have a google_place_id and are stale (>=25 days)
 *    — updates rating, price_level, photos, opening_hours, website, phone.
 * 2) Discover new venues by running a Nearby Search around the centroids of
 *    existing venue clusters (0.1° grid, >=10 venues). New places that are not
 *    already in the DB are inserted as inactive=true:false rows so they appear
 *    in recommendations.
 *
 * Designed to be invoked by pg_cron once a month. Hard limits keep API spend
 * well within the configured daily Google budget.
 */

const PRICE_MAP: Record<string, string> = {
  PRICE_LEVEL_FREE: '€',
  PRICE_LEVEL_INEXPENSIVE: '€',
  PRICE_LEVEL_MODERATE: '€€',
  PRICE_LEVEL_EXPENSIVE: '€€€',
  PRICE_LEVEL_VERY_EXPENSIVE: '€€€€',
};

const REFRESH_FIELD_MASK = [
  'id', 'displayName', 'formattedAddress', 'shortFormattedAddress',
  'location', 'rating', 'priceLevel', 'types', 'photos',
  'regularOpeningHours', 'websiteUri', 'internationalPhoneNumber',
].join(',');

const NEARBY_FIELD_MASK = [
  'places.id', 'places.displayName', 'places.formattedAddress',
  'places.location', 'places.rating', 'places.priceLevel',
  'places.types', 'places.photos', 'places.websiteUri',
].join(',');

function buildPhotoUrl(name: string, key: string, maxWidth = 800) {
  return `https://places.googleapis.com/v1/${name}/media?maxWidthPx=${maxWidth}&key=${key}`;
}

function mapPhotos(photos: any[] | undefined, key: string) {
  if (!Array.isArray(photos)) return [];
  return photos.slice(0, 3).map((p: any, i: number) => ({
    url: buildPhotoUrl(p.name, key, i === 0 ? 800 : 400),
    thumbnail: buildPhotoUrl(p.name, key, 200),
    width: p.widthPx || 400,
    height: p.heightPx || 300,
    attribution: p.authorAttributions?.[0]?.displayName || 'Google Photos',
    isGooglePhoto: true,
  }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!(await requireCronOrAdmin(req))) {
    console.warn('[refresh-google-venues] Unauthorized invocation');
    return unauthorizedResponse(corsHeaders);
  }

  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GOOGLE_PLACES_API_KEY not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const body = await req.json().catch(() => ({}));
  const refreshLimit = Math.min(Number(body?.refreshLimit ?? 200), 500);
  const discoveryLimit = Math.min(Number(body?.discoveryLimit ?? 30), 80);
  const discoveryRadius = Math.min(Number(body?.discoveryRadius ?? 2500), 5000);

  const stats = {
    refreshed: 0, refresh_failed: 0,
    clusters: 0, discovered: 0, inserted: 0, skipped_existing: 0,
    started_at: new Date().toISOString(),
  };

  // ── 1) REFRESH STALE VENUES ──────────────────────────────────────────────
  const { data: stale } = await supabase
    .from('venues')
    .select('id, google_place_id')
    .not('google_place_id', 'is', null)
    .eq('is_active', true)
    .lt('updated_at', new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString())
    .order('updated_at', { ascending: true })
    .limit(refreshLimit);

  for (const v of stale ?? []) {
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${v.google_place_id}?languageCode=de`,
        {
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': REFRESH_FIELD_MASK,
          },
        },
      );
      if (!res.ok) { stats.refresh_failed++; continue; }
      const place = await res.json();
      const photos = mapPhotos(place.photos, apiKey);
      const update: Record<string, unknown> = {
        rating: place.rating ?? undefined,
        price_range: PRICE_MAP[place.priceLevel] ?? undefined,
        photos: photos.length ? photos : undefined,
        image_url: photos[0]?.url ?? undefined,
        opening_hours: place.regularOpeningHours ?? undefined,
        website: place.websiteUri ?? undefined,
        phone: place.internationalPhoneNumber ?? undefined,
        address: place.shortFormattedAddress || place.formattedAddress || undefined,
        updated_at: new Date().toISOString(),
        last_validated_at: new Date().toISOString(),
      };
      Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);
      const { error } = await supabase.from('venues').update(update).eq('id', v.id);
      if (error) stats.refresh_failed++; else stats.refreshed++;
    } catch {
      stats.refresh_failed++;
    }
  }

  // ── 2) DISCOVER NEW VENUES IN ACTIVE CLUSTERS ────────────────────────────
  // Find 0.1° grid cells with >=10 venues; search around their centroid.
  const { data: clusters } = await supabase.rpc('get_venue_clusters', {
    min_count: 10, max_clusters: discoveryLimit,
  }).select?.() ?? { data: null };

  // Fallback: compute clusters in JS if RPC not present
  let clusterList: { lat: number; lng: number }[] = [];
  if (Array.isArray(clusters) && clusters.length) {
    clusterList = (clusters as any[]).map((c) => ({ lat: Number(c.lat), lng: Number(c.lng) }));
  } else {
    const { data: rows } = await supabase
      .from('venues')
      .select('latitude, longitude')
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .limit(2000);
    const grid = new Map<string, { lat: number; lng: number; c: number }>();
    for (const r of rows ?? []) {
      const lat = Math.round(Number(r.latitude) * 10) / 10;
      const lng = Math.round(Number(r.longitude) * 10) / 10;
      const key = `${lat},${lng}`;
      const cur = grid.get(key) ?? { lat, lng, c: 0 };
      cur.c++;
      grid.set(key, cur);
    }
    clusterList = [...grid.values()]
      .filter((g) => g.c >= 10)
      .sort((a, b) => b.c - a.c)
      .slice(0, discoveryLimit)
      .map(({ lat, lng }) => ({ lat, lng }));
  }
  stats.clusters = clusterList.length;

  // Existing google_place_ids — skip set
  const { data: existingRows } = await supabase
    .from('venues').select('google_place_id').not('google_place_id', 'is', null);
  const existingIds = new Set((existingRows ?? []).map((r: any) => r.google_place_id));

  for (const cluster of clusterList) {
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': NEARBY_FIELD_MASK,
        },
        body: JSON.stringify({
          includedTypes: ['restaurant', 'bar', 'cafe'],
          maxResultCount: 20,
          languageCode: 'de',
          locationRestriction: {
            circle: {
              center: { latitude: cluster.lat, longitude: cluster.lng },
              radius: discoveryRadius,
            },
          },
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const places = data.places ?? [];
      for (const place of places) {
        stats.discovered++;
        if (!place.id || existingIds.has(place.id)) { stats.skipped_existing++; continue; }
        existingIds.add(place.id);

        const photos = mapPhotos(place.photos, apiKey);
        const types: string[] = place.types ?? [];
        const cuisineType = types.includes('bar') ? 'Bar'
          : types.includes('cafe') ? 'Café'
          : 'Restaurant';

        const row = {
          id: `gp_${place.id}`,
          google_place_id: place.id,
          name: place.displayName?.text ?? 'Unknown',
          address: place.formattedAddress ?? '',
          latitude: place.location?.latitude,
          longitude: place.location?.longitude,
          rating: place.rating ?? null,
          price_range: PRICE_MAP[place.priceLevel] ?? '€€',
          cuisine_type: cuisineType,
          tags: types,
          photos: photos.length ? photos : null,
          image_url: photos[0]?.url ?? null,
          website: place.websiteUri ?? null,
          source: 'google_places_auto',
          is_active: true,
          verified: false,
          last_validated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from('venues').insert(row);
        if (!error) stats.inserted++;
      }
    } catch {
      // continue with next cluster
    }
  }

  const result = {
    ...stats,
    finished_at: new Date().toISOString(),
  };
  console.log('🔁 REFRESH-GOOGLE-VENUES:', JSON.stringify(result));
  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});