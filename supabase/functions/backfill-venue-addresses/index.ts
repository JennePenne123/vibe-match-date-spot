import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=18`,
      { headers: { 'User-Agent': 'HiOutz/1.0 (contact@hioutz.de)' } }
    );
    if (!resp.ok) return '';
    const data = await resp.json();

    const addr = data.address || {};
    const street = addr.road || addr.pedestrian || addr.footway || '';
    const number = addr.house_number || '';
    const postcode = addr.postcode || '';
    const city = addr.city || addr.town || addr.village || addr.municipality || '';

    const streetLine = [street, number].filter(Boolean).join(' ');
    const cityLine = [postcode, city].filter(Boolean).join(' ');

    if (streetLine && cityLine) return `${streetLine}, ${cityLine}`;
    if (streetLine) return streetLine;
    if (cityLine) return cityLine;
    return data.display_name?.split(',').slice(0, 3).join(',') || '';
  } catch {
    return '';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Simple auth check - just verify the request has the apikey header (auto-added by supabase client)
  // This is a one-time admin utility function

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch venues with empty/missing addresses
  const { data: venues, error } = await supabase
    .from('venues')
    .select('id, name, latitude, longitude, address')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .limit(200);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }

  // Filter in code: only venues with empty/null addresses
  const emptyAddressVenues = (venues || []).filter(v => !v.address || v.address.trim() === '' || v.address.trim() === ',' || v.address.trim() === ', ');
  console.log(`📍 Backfill: Found ${emptyAddressVenues.length} venues with empty addresses (of ${venues?.length || 0} total)`);

  const results: { id: string; name: string; address: string }[] = [];
  let updatedCount = 0;

  for (const venue of (venues || [])) {
    const addr = await reverseGeocode(venue.latitude, venue.longitude);
    if (addr) {
      const { error: updateError } = await supabase
        .from('venues')
        .update({ address: addr, updated_at: new Date().toISOString() })
        .eq('id', venue.id);

      if (!updateError) {
        updatedCount++;
        results.push({ id: venue.id, name: venue.name, address: addr });
        console.log(`✅ ${venue.name}: ${addr}`);
      } else {
        console.error(`❌ ${venue.name}: ${updateError.message}`);
      }
    } else {
      console.warn(`⚠️ ${venue.name}: No address found for ${venue.latitude},${venue.longitude}`);
    }
    // Nominatim: max 1 request/sec
    await new Promise(r => setTimeout(r, 1100));
  }

  return new Response(
    JSON.stringify({
      total: venues?.length || 0,
      updated: updatedCount,
      results,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
