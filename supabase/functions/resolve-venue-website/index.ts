import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/**
 * Resolves the real website (and phone) of a venue via Google Places (New v1)
 * and persists it on the venue row.
 *
 * Body: { venueId?: string, placeId?: string, name: string, address?: string,
 *         latitude?: number, longitude?: number }
 * Response: { website: string | null, phone: string | null, placeId: string | null }
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) return json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, 500);

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userError } = await authClient.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (userError || !userData?.user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const venueId: string | undefined = body?.venueId;
    let placeId: string | null = body?.placeId ?? null;
    const name: string = String(body?.name || '').trim();
    const address: string = String(body?.address || '').trim();
    const lat = Number(body?.latitude);
    const lng = Number(body?.longitude);

    if (!placeId && !name) return json({ error: 'name or placeId required' }, 400);

    const FIELDS = 'id,websiteUri,nationalPhoneNumber,internationalPhoneNumber';

    // 1) Find the place id if we don't have one
    if (!placeId) {
      const searchBody: Record<string, unknown> = {
        textQuery: [name, address].filter(Boolean).join(', '),
        maxResultCount: 1,
        languageCode: 'de',
      };
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        searchBody.locationBias = {
          circle: { center: { latitude: lat, longitude: lng }, radius: 800.0 },
        };
      }
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': `places.id,places.websiteUri,places.nationalPhoneNumber,places.internationalPhoneNumber`,
        },
        body: JSON.stringify(searchBody),
      });
      if (!res.ok) {
        console.error('searchText failed', res.status, await res.text());
        return json({ website: null, phone: null, placeId: null });
      }
      const data = await res.json();
      const place = data.places?.[0];
      if (!place?.id) return json({ website: null, phone: null, placeId: null });
      placeId = place.id;
      const website = place.websiteUri || null;
      const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || null;
      await persist(venueId, placeId, website, phone);
      return json({ website, phone, placeId });
    }

    // 2) Place Details for a known place id
    const detailsRes = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?languageCode=de`,
      { headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': FIELDS } },
    );
    if (!detailsRes.ok) {
      console.error('place details failed', detailsRes.status, await detailsRes.text());
      return json({ website: null, phone: null, placeId });
    }
    const place = await detailsRes.json();
    const website = place.websiteUri || null;
    const phone = place.nationalPhoneNumber || place.internationalPhoneNumber || null;
    await persist(venueId, placeId, website, phone);
    return json({ website, phone, placeId });
  } catch (err) {
    console.error('resolve-venue-website fatal:', err);
    return json({ error: String(err) }, 500);
  }
});

async function persist(
  venueId: string | undefined,
  placeId: string | null,
  website: string | null,
  phone: string | null,
) {
  if (!venueId || (!website && !phone && !placeId)) return;
  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (website) payload.website = website;
    if (phone) payload.phone = phone;
    if (placeId) payload.google_place_id = placeId;
    await admin.from('venues').update(payload).eq('id', venueId);
  } catch (e) {
    console.error('persist failed', e);
  }
}
