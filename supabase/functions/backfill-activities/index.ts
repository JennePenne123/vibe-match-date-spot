// Backfill Activities Edge Function — Admin-only.
// Importiert gezielt Kultur-/Aktivitäts-/Nightlife-Venues für eine Stadt
// aus OpenStreetMap (Overpass), damit die situativen Quick-Actions auf
// Home (Kultur, Aktivität, Nightlife) sinnvolle Empfehlungen liefern.
//
// Body: { latitude, longitude, radius_km?, categories?: ('culture'|'activity'|'nightlife')[] }

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders } from '../_shared/cors.ts';

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

type CategoryId = 'culture' | 'activity' | 'nightlife';

const CATEGORY_TAGS: Record<CategoryId, Array<[string, string]>> = {
  culture: [
    ['tourism', 'museum'], ['tourism', 'gallery'],
    ['tourism', 'aquarium'], ['tourism', 'zoo'], ['tourism', 'theme_park'],
    ['tourism', 'attraction'], ['tourism', 'artwork'], ['tourism', 'viewpoint'],
    ['amenity', 'theatre'], ['amenity', 'cinema'], ['amenity', 'arts_centre'],
    ['amenity', 'concert_hall'], ['amenity', 'planetarium'], ['amenity', 'library'],
    ['amenity', 'exhibition_centre'], ['amenity', 'community_centre'],
    ['amenity', 'studio'],
    ['historic', 'monument'], ['historic', 'castle'],
    ['historic', 'memorial'], ['historic', 'ruins'], ['historic', 'archaeological_site'],
    ['historic', 'church'], ['building', 'cathedral'], ['building', 'church'],
  ],
  activity: [
    ['leisure', 'bowling_alley'], ['leisure', 'miniature_golf'],
    ['leisure', 'amusement_arcade'], ['leisure', 'escape_game'],
    ['leisure', 'climbing'], ['sport', 'climbing'],
    ['sport', 'bouldering'], ['leisure', 'climbing_adventure'],
    ['leisure', 'swimming_pool'], ['leisure', 'water_park'],
    ['leisure', 'spa'], ['amenity', 'spa'],
    ['leisure', 'sauna'], ['amenity', 'public_bath'], ['leisure', 'beach_resort'],
    ['leisure', 'sports_centre'], ['leisure', 'fitness_centre'],
    ['leisure', 'ice_rink'], ['leisure', 'trampoline_park'],
    ['leisure', 'adventure_park'], ['leisure', 'horse_riding'],
    ['leisure', 'dance'], ['leisure', 'fitness_station'],
    ['leisure', 'pitch'], ['leisure', 'park'], ['leisure', 'garden'],
    ['leisure', 'playground'], ['leisure', 'beach_resort'],
    ['shop', 'sports'], ['amenity', 'pottery'], ['craft', 'pottery'],
    ['amenity', 'cooking_school'], ['amenity', 'dancing_school'],
    ['sport', 'yoga'], ['sport', 'tennis'], ['sport', 'soccer'],
    ['sport', 'basketball'], ['sport', 'badminton'], ['sport', 'squash'],
    ['sport', 'table_tennis'], ['sport', 'darts'], ['sport', 'billiards'],
    ['sport', 'archery'], ['sport', 'shooting'],
    ['sport', 'go_kart'], ['sport', 'paintball'], ['sport', 'laser_tag'],
    ['sport', 'surfing'], ['sport', 'kitesurfing'], ['sport', 'sailing'],
    ['sport', 'canoe'], ['sport', 'rowing'],
  ],
  nightlife: [
    ['amenity', 'bar'], ['amenity', 'pub'], ['amenity', 'nightclub'],
    ['amenity', 'biergarten'], ['amenity', 'casino'], ['amenity', 'karaoke_box'],
    ['amenity', 'stripclub'], ['amenity', 'gambling'],
    ['amenity', 'events_venue'], ['amenity', 'social_club'],
    ['shop', 'shisha'], ['amenity', 'shisha'],
  ],
};

function buildQueries(lat: number, lng: number, radiusM: number, tags: Array<[string, string]>): string[] {
  const r = Math.min(radiusM, 50000);
  const chunkSize = 10;
  const queries: string[] = [];

  for (let i = 0; i < tags.length; i += chunkSize) {
    const chunk = tags.slice(i, i + chunkSize);
    const clauses = chunk
      .flatMap(([k, v]) => [
        `node["${k}"="${v}"](around:${r},${lat},${lng});`,
        `way["${k}"="${v}"](around:${r},${lat},${lng});`,
      ])
      .join('\n    ');

    queries.push(`[out:json][timeout:25];(\n    ${clauses}\n  );out center body 200;`);
  }

  return queries;
}

async function fetchOverpass(query: string): Promise<any> {
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 25000);
      const resp = await fetch(mirror, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (resp.ok) return await resp.json();
      await resp.text();
      if (resp.status === 429 || resp.status >= 500) continue;
      throw new Error(`Overpass HTTP ${resp.status}`);
    } catch (_e) {
      continue;
    }
  }
  return null;
}

async function fetchOverpassBatched(queries: string[]): Promise<any[]> {
  const merged: any[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    const data = await fetchOverpass(query);
    const elements = (data?.elements ?? []) as any[];

    for (const el of elements) {
      const key = `${el.type ?? 'unknown'}:${el.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(el);
    }
  }

  return merged;
}

function categoryFromTags(tags: Record<string, string>): { cuisine: string; tags: string[] } {
  const a = tags.amenity, l = tags.leisure, t = tags.tourism, s = tags.sport, h = tags.historic;
  const c = tags.craft, b = tags.building, sh = tags.shop;
  // Culture (tourism)
  if (t === 'museum') return { cuisine: 'Museum', tags: ['museum', 'cultural', 'arts-entertainment', 'art', 'kunst', 'daytime'] };
  if (t === 'gallery') return { cuisine: 'Gallery', tags: ['gallery', 'galerie', 'art gallery', 'cultural', 'arts-entertainment'] };
  if (t === 'aquarium') return { cuisine: 'Aquarium', tags: ['aquarium', 'cultural', 'arts-entertainment', 'family', 'daytime'] };
  if (t === 'zoo') return { cuisine: 'Zoo', tags: ['zoo', 'tierpark', 'cultural', 'family', 'daytime'] };
  if (t === 'theme_park') return { cuisine: 'Theme Park', tags: ['theme park', 'amusement park', 'family', 'fun', 'active'] };
  if (t === 'attraction') return { cuisine: 'Attraction', tags: ['attraction', 'sightseeing', 'cultural', 'tourism'] };
  if (t === 'artwork') return { cuisine: 'Public Art', tags: ['artwork', 'street art', 'cultural', 'art'] };
  if (t === 'viewpoint') return { cuisine: 'Viewpoint', tags: ['viewpoint', 'aussichtspunkt', 'sightseeing', 'romantic'] };
  // Culture (amenity)
  if (a === 'theatre') return { cuisine: 'Theater', tags: ['theatre', 'theater', 'cultural', 'arts-entertainment', 'evening'] };
  if (a === 'cinema') return { cuisine: 'Cinema', tags: ['cinema', 'kino', 'entertainment', 'arts-entertainment', 'evening'] };
  if (a === 'arts_centre') return { cuisine: 'Arts Centre', tags: ['arts-entertainment', 'cultural', 'kunst'] };
  if (a === 'concert_hall') return { cuisine: 'Concert Hall', tags: ['concert hall', 'konzerthaus', 'cultural', 'arts-entertainment', 'evening'] };
  if (a === 'planetarium') return { cuisine: 'Planetarium', tags: ['planetarium', 'cultural', 'arts-entertainment'] };
  if (a === 'library') return { cuisine: 'Library', tags: ['library', 'cultural', 'quiet'] };
  if (a === 'exhibition_centre') return { cuisine: 'Exhibition', tags: ['exhibition', 'ausstellung', 'cultural', 'arts-entertainment'] };
  if (a === 'community_centre') return { cuisine: 'Community Centre', tags: ['community centre', 'kulturzentrum', 'cultural'] };
  if (a === 'studio') return { cuisine: 'Studio', tags: ['studio', 'cultural', 'arts-entertainment'] };
  // Culture (historic / building)
  if (h === 'monument' || h === 'castle') return { cuisine: 'Historic', tags: ['historic', 'cultural', 'sightseeing'] };
  if (h === 'memorial') return { cuisine: 'Memorial', tags: ['memorial', 'historic', 'cultural', 'sightseeing'] };
  if (h === 'ruins' || h === 'archaeological_site') return { cuisine: 'Historic Site', tags: ['ruins', 'historic', 'cultural', 'sightseeing'] };
  if (h === 'church' || b === 'cathedral' || b === 'church') return { cuisine: 'Church', tags: ['church', 'kirche', 'historic', 'cultural', 'sightseeing'] };
  // Activities (leisure)
  if (l === 'bowling_alley') return { cuisine: 'Bowling', tags: ['bowling', 'bowling-alley', 'active', 'fun'] };
  if (l === 'miniature_golf') return { cuisine: 'Mini Golf', tags: ['mini golf', 'minigolf', 'active', 'fun'] };
  if (l === 'amusement_arcade') return { cuisine: 'Arcade', tags: ['arcade', 'fun', 'active'] };
  if (l === 'escape_game') return { cuisine: 'Escape Room', tags: ['escape room', 'escape-room', 'fun', 'active'] };
  if (l === 'climbing' || (l as string) === 'climbing_adventure' || s === 'climbing' || s === 'bouldering') return { cuisine: 'Climbing', tags: ['climbing', 'bouldering', 'klettern', 'kletterhalle', 'boulderhalle', 'active', 'sport'] };
  if (l === 'swimming_pool' || l === 'water_park') return { cuisine: 'Swimming', tags: ['swimming', 'aquapark', 'active'] };
  if (l === 'spa' || a === 'spa' || (l as string) === 'sauna' || a === 'public_bath') return { cuisine: 'Spa & Wellness', tags: ['spa', 'sauna', 'wellness', 'therme', 'relaxing'] };
  if ((l as string) === 'beach_resort') return { cuisine: 'Beach Resort', tags: ['beach', 'strand', 'relaxing'] };
  if (l === 'sports_centre' || l === 'fitness_centre') return { cuisine: 'Sport', tags: ['sport', 'active', 'fitness'] };
  if (l === 'ice_rink') return { cuisine: 'Ice Rink', tags: ['ice skating', 'eislaufen', 'active', 'fun'] };
  if (l === 'trampoline_park') return { cuisine: 'Trampoline Park', tags: ['trampoline', 'trampolinhalle', 'active', 'fun'] };
  if ((l as string) === 'adventure_park') return { cuisine: 'Adventure Park', tags: ['adventure park', 'kletterpark', 'active', 'fun', 'outdoor'] };
  if ((l as string) === 'horse_riding') return { cuisine: 'Horse Riding', tags: ['horse riding', 'reiten', 'active', 'outdoor'] };
  if ((l as string) === 'dance' || a === 'dancing_school') return { cuisine: 'Dance', tags: ['dance', 'tanzschule', 'active', 'social'] };
  if ((l as string) === 'park' || (l as string) === 'garden') return { cuisine: 'Park', tags: ['park', 'garden', 'outdoor', 'relaxing', 'walk'] };
  // Activities (craft / amenity workshops)
  if (c === 'pottery' || (a as string) === 'pottery') return { cuisine: 'Pottery', tags: ['pottery', 'töpfern', 'crafts', 'creative', 'workshop'] };
  if (a === 'cooking_school') return { cuisine: 'Cooking School', tags: ['cooking school', 'kochkurs', 'workshop', 'creative'] };
  // Activities (sport)
  if (s === 'yoga') return { cuisine: 'Yoga', tags: ['yoga', 'wellness', 'relaxing', 'active'] };
  if (s === 'tennis' || s === 'badminton' || s === 'squash' || s === 'table_tennis') return { cuisine: 'Racquet Sport', tags: [s, 'sport', 'active'] };
  if (s === 'darts' || s === 'billiards') return { cuisine: 'Pub Sport', tags: [s, 'fun', 'social', 'pub'] };
  if (s === 'surfing' || s === 'kitesurfing' || s === 'sailing' || s === 'canoe' || s === 'rowing') return { cuisine: 'Watersport', tags: [s, 'watersport', 'active', 'outdoor'] };
  if (s === 'go_kart') return { cuisine: 'Go-Kart', tags: ['kart', 'go-kart', 'active', 'fun'] };
  if (s === 'paintball') return { cuisine: 'Paintball', tags: ['paintball', 'active', 'fun'] };
  if (s === 'laser_tag') return { cuisine: 'Laser Tag', tags: ['lasertag', 'laser tag', 'active', 'fun'] };
  // Nightlife
  if (a === 'bar') return { cuisine: 'Bar', tags: ['bar', 'evening', 'drinks', 'nightlife', 'cocktails'] };
  if (a === 'pub') return { cuisine: 'Pub', tags: ['pub', 'evening', 'drinks', 'nightlife'] };
  if (a === 'nightclub') return { cuisine: 'Nightclub', tags: ['nightclub', 'nightlife', 'party', 'lively', 'late night'] };
  if (a === 'biergarten') return { cuisine: 'Biergarten', tags: ['biergarten', 'outdoor seating', 'evening'] };
  if (a === 'casino' || (a as string) === 'gambling') return { cuisine: 'Casino', tags: ['casino', 'nightlife', 'late night'] };
  if (a === 'karaoke_box') return { cuisine: 'Karaoke', tags: ['karaoke', 'nightlife', 'lively'] };
  if ((a as string) === 'stripclub') return { cuisine: 'Adult Club', tags: ['adult', 'nightlife', 'late night'] };
  if ((a as string) === 'events_venue' || (a as string) === 'social_club') return { cuisine: 'Events Venue', tags: ['events', 'nightlife', 'party'] };
  if (sh === 'shisha' || (a as string) === 'shisha') return { cuisine: 'Shisha Bar', tags: ['shisha', 'shishabar', 'hookah', 'nightlife', 'evening'] };
  return { cuisine: 'Venue', tags: [] };
}

function buildAddress(tags: Record<string, string>): string {
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
  const city = [tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(' ');
  if (street && city) return `${street}, ${city}`;
  return street || city || '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Auth: only admins
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: roleRow } = await supabase
      .from('user_roles').select('role')
      .eq('user_id', userData.user.id).eq('role', 'admin').maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const lat = Number(body.latitude);
    const lng = Number(body.longitude);
    const radiusKm = Math.min(Math.max(Number(body.radius_km ?? 25), 1), 50);
    const requested: CategoryId[] = Array.isArray(body.categories) && body.categories.length > 0
      ? body.categories.filter((c: string) => c === 'culture' || c === 'activity' || c === 'nightlife')
      : ['culture', 'activity', 'nightlife'];

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return new Response(JSON.stringify({ error: 'latitude and longitude required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const radiusM = radiusKm * 1000;
    const summary: Record<string, { fetched: number; saved: number }> = {};
    let grandTotal = 0;

    for (const category of requested) {
      const queries = buildQueries(lat, lng, radiusM, CATEGORY_TAGS[category]);
      const elements = await fetchOverpassBatched(queries);

      const venues = elements
        .filter((el) => el.tags?.name)
        .map((el) => {
          const tags = el.tags || {};
          const venueLat = el.lat ?? el.center?.lat;
          const venueLon = el.lon ?? el.center?.lon;
          const meta = categoryFromTags(tags);
          const address = buildAddress(tags);
          // Fallback chain so we never violate the NOT NULL address column
          const fallbackAddress =
            address
            || [tags['addr:suburb'], tags['addr:city']].filter(Boolean).join(', ')
            || tags['addr:city']
            || tags['addr:suburb']
            || tags['is_in:city']
            || tags['is_in']
            || tags.name; // last-resort: use the venue name itself
          return {
            id: `osm_${el.id}`,
            name: tags.name,
            address: fallbackAddress,
            latitude: venueLat,
            longitude: venueLon,
            cuisine_type: meta.cuisine,
            price_range: '$$',
            rating: null as number | null,
            description: tags.description || tags.note || '',
            phone: tags.phone || tags['contact:phone'] || '',
            website: tags.website || tags['contact:website'] || tags.url || '',
            tags: meta.tags,
            source: 'openstreetmap',
            is_active: true,
            updated_at: new Date().toISOString(),
          };
        })
        // Require coordinates + a non-empty address (NOT NULL constraint)
        .filter((v) => v.latitude && v.longitude && v.address);

      let saved = 0;
      for (let i = 0; i < venues.length; i += 100) {
        const chunk = venues.slice(i, i + 100);
        const { error } = await supabase.from('venues').upsert(chunk, { onConflict: 'id' });
        if (!error) saved += chunk.length;
        else console.error(`backfill chunk error (${category}):`, error.message);
      }

      summary[category] = { fetched: venues.length, saved };
      grandTotal += saved;
      console.log(`✅ backfill ${category}: ${saved}/${venues.length} (queries: ${queries.length})`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        location: { latitude: lat, longitude: lng, radius_km: radiusKm },
        total_saved: grandTotal,
        per_category: summary,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('🔴 backfill-activities error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});