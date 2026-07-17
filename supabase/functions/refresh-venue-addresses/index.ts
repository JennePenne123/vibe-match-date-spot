import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Refreshes venue addresses from Google Places (New v1).
 *
 * Two modes, controlled by `mode`:
 *  - "resolve" (default): venues WITHOUT google_place_id — uses Text Search
 *    biased to the venue's coordinates to find the matching place, then writes
 *    formattedAddress + google_place_id. Fixes imports from Radar/OSM where
 *    the "address" is only the nearest street name.
 *  - "refresh": venues WITH google_place_id — Place Details lookup to refresh
 *    the address (short/formatted) to the current Google value.
 *
 * Body: { limit?: number (1..25), mode?: "resolve" | "refresh" }
 * Response: { processed, updated, skipped, remaining, mode }
 *
 * Admin-only.
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

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace('Bearer ', '');
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

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body?.limit) || 15, 1), 25);
    const mode: 'resolve' | 'refresh' = body?.mode === 'refresh' ? 'refresh' : 'resolve';

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    let processed = 0;
    let updated = 0;
    let skipped = 0;

    if (mode === 'resolve') {
      const { data: venues, error: fetchErr } = await admin
        .from('venues')
        .select('id, name, address, latitude, longitude')
        .is('google_place_id', null)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .eq('is_active', true)
        .limit(limit);
      if (fetchErr) throw fetchErr;

      const { count: remainingBefore } = await admin
        .from('venues')
        .select('id', { count: 'exact', head: true })
        .is('google_place_id', null)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .eq('is_active', true);

      for (const v of venues || []) {
        processed++;
        try {
          const lat = Number(v.latitude);
          const lng = Number(v.longitude);
          const textQuery = [v.name, v.address].filter(Boolean).join(', ');

          const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask':
                'places.id,places.formattedAddress,places.shortFormattedAddress,places.location,places.displayName',
            },
            body: JSON.stringify({
              textQuery,
              maxResultCount: 1,
              locationBias: {
                circle: { center: { latitude: lat, longitude: lng }, radius: 500.0 },
              },
            }),
          });
          if (!res.ok) { skipped++; continue; }
          const json = await res.json();
          const place = json.places?.[0];
          if (!place?.id) { skipped++; continue; }

          const googleAddr = place.shortFormattedAddress || place.formattedAddress;
          const payload: Record<string, unknown> = {
            google_place_id: place.id,
            updated_at: new Date().toISOString(),
            last_validated_at: new Date().toISOString(),
          };
          if (googleAddr && typeof googleAddr === 'string' && googleAddr.trim()) {
            payload.address = googleAddr;
          }
          const { error: uErr } = await admin.from('venues').update(payload).eq('id', v.id);
          if (uErr) { skipped++; continue; }
          updated++;
        } catch {
          skipped++;
        }
      }

      const remaining = Math.max((remainingBefore || 0) - updated, 0);
      return new Response(
        JSON.stringify({ processed, updated, skipped, remaining, mode }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // mode === 'refresh': venues with google_place_id → Place Details
    const { data: venues, error: fetchErr } = await admin
      .from('venues')
      .select('id, google_place_id')
      .not('google_place_id', 'is', null)
      .eq('is_active', true)
      .order('last_validated_at', { ascending: true, nullsFirst: true })
      .limit(limit);
    if (fetchErr) throw fetchErr;

    const { count: remainingBefore } = await admin
      .from('venues')
      .select('id', { count: 'exact', head: true })
      .not('google_place_id', 'is', null)
      .eq('is_active', true);

    for (const v of venues || []) {
      processed++;
      try {
        const res = await fetch(
          `https://places.googleapis.com/v1/places/${v.google_place_id}?languageCode=de`,
          {
            headers: {
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'id,formattedAddress,shortFormattedAddress',
            },
          },
        );
        if (!res.ok) { skipped++; continue; }
        const place = await res.json();
        const googleAddr = place.shortFormattedAddress || place.formattedAddress;
        if (!googleAddr) { skipped++; continue; }

        const { error: uErr } = await admin
          .from('venues')
          .update({
            address: googleAddr,
            updated_at: new Date().toISOString(),
            last_validated_at: new Date().toISOString(),
          })
          .eq('id', v.id);
        if (uErr) { skipped++; continue; }
        updated++;
      } catch {
        skipped++;
      }
    }

    return new Response(
      JSON.stringify({ processed, updated, skipped, remaining: remainingBefore || 0, mode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('refresh-venue-addresses fatal:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});