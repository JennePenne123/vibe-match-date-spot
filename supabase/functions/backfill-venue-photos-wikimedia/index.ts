import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { getCachedVenueIds, recordPhotoAttempt } from '../_shared/photo-attempt-cache.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UA = 'HIOutz/1.0 (https://hioutz.app; venue photo backfill)';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

/**
 * Free photo fallback: pulls real venue photos from Wikimedia Commons
 * (geosearch around the venue coordinates) for venues that have no real
 * photos yet. Runs BEFORE any paid Google Places backfill.
 *
 * Auth: shared cron token (x-cron-token) or admin JWT.
 * Body: { limit?: number, radius?: number, cuisine_types?: string[] }
 */

const STOPWORDS = new Set([
  'the', 'der', 'die', 'das', 'und', 'and', 'von', 'van', 'am', 'im', 'in', 'an', 'zum', 'zur',
  'bar', 'cafe', 'café', 'restaurant', 'hotel', 'gmbh', 'park', 'garten', 'garden',
]);

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function nameScore(venueName: string, fileTitle: string): number {
  const venueTokens = tokenize(venueName);
  if (venueTokens.length === 0) return 0;
  const fileTokens = new Set(tokenize(fileTitle));
  const hits = venueTokens.filter((t) => fileTokens.has(t)).length;
  return hits / venueTokens.length;
}

function commonsUrl(title: string, width: number): string {
  const file = encodeURIComponent(title.replace(/^File:/i, '').replace(/ /g, '_'));
  return `https://commons.wikimedia.org/w/thumb.php?f=${file}&w=${width}`;
}

async function commonsGeoSearch(lat: number, lng: number, radius: number) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'geosearch',
    ggsnamespace: '6',
    ggscoord: `${lat}|${lng}`,
    ggsradius: String(radius),
    ggslimit: '20',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: '800',
  });
  const res = await fetch(`${COMMONS_API}?${params.toString()}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Commons ${res.status}`);
  const json = await res.json();
  const pages = json?.query?.pages ? Object.values(json.query.pages) : [];
  return pages as any[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // --- Auth: shared cron token or admin JWT ---
    const { data: control } = await admin
      .from('venue_import_control')
      .select('cron_token')
      .eq('id', true)
      .maybeSingle();
    const cronToken = req.headers.get('x-cron-token');
    const cronAuthorized = Boolean(cronToken && control?.cron_token && cronToken === control.cron_token);

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
      const { data: isAdmin, error: roleErr } = await authClient.rpc('has_role', {
        _user_id: claimsData.claims.sub as string,
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
    const limit = Math.min(Math.max(Number(body?.limit) || 25, 1), 100);
    const radius = Math.min(Math.max(Number(body?.radius) || 250, 10), 1000);
    const cuisineTypes: string[] = Array.isArray(body?.cuisine_types)
      ? body.cuisine_types.filter((v: unknown) => typeof v === 'string' && v.length > 0).slice(0, 20)
      : [];

    // Candidates: active, geocoded, no Google place id and no real photos yet.
    let query = admin
      .from('venues')
      .select('id, name, latitude, longitude, photos')
      .is('google_place_id', null)
      .or('photos.is.null,photos.eq.[]')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .eq('is_active', true)
      // Over-fetch so cooldown-cached venues can be filtered out client-side.
      .limit(limit * 4);
    if (cuisineTypes.length > 0) query = query.in('cuisine_type', cuisineTypes);

    const { data: pool, error: fetchErr } = await query;
    if (fetchErr) {
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Photo cache: never re-query the same venue inside its cooldown window.
    const cached = await getCachedVenueIds(
      admin,
      'wikimedia',
      (pool || []).map((v: { id: string }) => v.id),
    );
    const venues = (pool || []).filter((v: { id: string }) => !cached.has(v.id)).slice(0, limit);
    const cacheSkipped = (pool || []).length - (pool || []).filter((v: { id: string }) => !cached.has(v.id)).length;

    let processed = 0;
    let matched = 0;
    let updated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const v of venues || []) {
      processed++;
      try {
        if (Array.isArray(v.photos) && v.photos.length > 0) {
          skipped++;
          continue;
        }
        const pages = await commonsGeoSearch(Number(v.latitude), Number(v.longitude), radius);

        const scored = pages
          .map((p: any) => {
            const info = p.imageinfo?.[0];
            if (!info?.url) return null;
            const mime: string = info.mime || '';
            if (mime && !mime.startsWith('image/')) return null;
            const title: string = p.title || '';
            if (/\.(svg|pdf|ogg|webm|tif)$/i.test(title)) return null;
            return {
              title,
              score: nameScore(v.name || '', title),
              url: info.thumburl || info.url,
              fullUrl: info.url,
              width: info.thumbwidth || info.width || 800,
              height: info.thumbheight || info.height || 600,
              artist: (info.extmetadata?.Artist?.value || '')
                .replace(/<[^>]*>/g, '')
                .trim()
                .slice(0, 120),
              license: (info.extmetadata?.LicenseShortName?.value || '').trim().slice(0, 60),
            };
          })
          .filter(Boolean) as any[];

        // Only accept photos whose file name actually mentions the venue —
        // otherwise we would show a random nearby building.
        const candidates = scored
          .filter((c) => c.score >= 0.5)
          .sort((a, b) => b.score - a.score)
          .slice(0, 5);

        if (candidates.length === 0) {
          await recordPhotoAttempt(admin, { venueId: v.id, source: 'wikimedia', status: 'miss' });
          skipped++;
          continue;
        }
        matched++;

        const photos = candidates.map((c) => ({
          url: c.url,
          thumbnail: commonsUrl(c.title, 200),
          width: c.width,
          height: c.height,
          attribution: [c.artist, c.license].filter(Boolean).join(' · ') || 'Wikimedia Commons',
          isGooglePhoto: false,
          source: 'wikimedia',
          sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(c.title)}`,
        }));

        const { error: updateErr } = await admin
          .from('venues')
          .update({
            photos,
            image_url: photos[0].url,
            updated_at: new Date().toISOString(),
          })
          .eq('id', v.id);

        if (updateErr) {
          await recordPhotoAttempt(admin, {
            venueId: v.id,
            source: 'wikimedia',
            status: 'error',
            message: updateErr.message,
          });
          errors.push(`${v.id}: ${updateErr.message}`);
          skipped++;
        } else {
          await recordPhotoAttempt(admin, {
            venueId: v.id,
            source: 'wikimedia',
            status: 'hit',
            photoCount: photos.length,
          });
          updated++;
        }
      } catch (err) {
        await recordPhotoAttempt(admin, {
          venueId: v.id,
          source: 'wikimedia',
          status: 'error',
          message: String(err),
        });
        errors.push(`${v.id}: ${String(err)}`);
        skipped++;
      }
      // Be polite to the Wikimedia API.
      await new Promise((r) => setTimeout(r, 120));
    }

    return new Response(
      JSON.stringify({ processed, matched, updated, skipped, cacheSkipped, errors: errors.slice(0, 10) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('backfill-venue-photos-wikimedia fatal:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
