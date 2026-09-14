// Venue Import Worker — verarbeitet die Warteschlange `venue_import_jobs`.
//
// Aufruf:
//  - per pg_cron (Header `x-cron-token` == venue_import_control.cron_token)
//  - per Admin-JWT aus dem Admin-Bereich
//
// Sicherheitsnetz gegen Kostenexplosionen:
//  - Single-Flight-Lease in `venue_import_control.lease_until`
//  - Pausenschalter `venue_import_control.paused` wird an JEDEM Einstieg geprüft
//  - harte Zeitgrenze pro Lauf + Resume-Cursor (chunk_offset)
//  - begrenztes Hop-Budget für die Selbst-Fortsetzung, Cooldown zwischen Hops
//  - Job wird nach 3 Fehlversuchen auf 'failed' gesetzt

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const OVERPASS_MIRRORS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.osm.jp/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
];
const OVERPASS_USER_AGENT = 'HiOutz/1.0 (+https://hioutz.app)';
const REQUEST_DELAY_MS = 1_200;
const RUN_BUDGET_MS = 30_000;
const LEASE_MS = 120_000;
const MAX_HOPS = 400;
const HOP_COOLDOWN_MS = 1_500;
// Overpass-Mirrors sind häufig überlastet -> mehr Versuche, Jobs werden
// zusätzlich automatisch wieder eingereiht (siehe requeueStaleFailures).
const MAX_ATTEMPTS = 12;
const REQUEUE_AFTER_MINUTES = 45;
// Rotierender Startpunkt, damit nicht alle Läufe denselben Mirror hämmern.
let mirrorCursor = Math.floor(Math.random() * OVERPASS_MIRRORS.length);

type CategoryId = 'food' | 'culture' | 'activity' | 'nightlife';

const CATEGORY_TAGS: Record<CategoryId, Array<[string, string]>> = {
  food: [
    ['amenity', 'restaurant'], ['amenity', 'cafe'], ['amenity', 'fast_food'],
    ['amenity', 'ice_cream'], ['amenity', 'food_court'],
    ['shop', 'bakery'], ['shop', 'pastry'], ['shop', 'deli'],
    ['shop', 'confectionery'], ['shop', 'coffee'],
  ],
  culture: [
    ['tourism', 'museum'], ['tourism', 'gallery'], ['tourism', 'aquarium'],
    ['tourism', 'zoo'], ['tourism', 'theme_park'], ['tourism', 'attraction'],
    ['amenity', 'theatre'], ['amenity', 'cinema'], ['amenity', 'arts_centre'],
    ['amenity', 'concert_hall'], ['amenity', 'planetarium'], ['amenity', 'library'],
    ['amenity', 'exhibition_centre'], ['historic', 'castle'],
  ],
  activity: [
    ['leisure', 'bowling_alley'], ['leisure', 'miniature_golf'],
    ['leisure', 'amusement_arcade'], ['leisure', 'escape_game'],
    ['leisure', 'climbing'], ['sport', 'climbing'], ['sport', 'bouldering'],
    ['leisure', 'swimming_pool'], ['leisure', 'water_park'],
    ['leisure', 'spa'], ['leisure', 'sauna'], ['leisure', 'ice_rink'],
    ['leisure', 'trampoline_park'], ['leisure', 'adventure_park'],
    ['leisure', 'horse_riding'], ['leisure', 'dance'],
    ['sport', 'go_kart'], ['sport', 'paintball'], ['sport', 'laser_tag'],
    ['sport', 'billiards'], ['sport', 'darts'], ['sport', 'surfing'],
    ['sport', 'sailing'], ['amenity', 'cooking_school'],
  ],
  nightlife: [
    ['amenity', 'bar'], ['amenity', 'pub'], ['amenity', 'nightclub'],
    ['amenity', 'biergarten'], ['amenity', 'casino'], ['amenity', 'karaoke_box'],
    ['amenity', 'events_venue'], ['shop', 'shisha'],
  ],
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function buildQuery(lat: number, lon: number, radiusM: number, k: string, v: string) {
  const r = Math.min(radiusM, 50000);
  return `[out:json][timeout:60];(node["${k}"="${v}"](around:${r},${lat},${lon});way["${k}"="${v}"](around:${r},${lat},${lon}););out center body;`;
}

// Große Städte + häufige Tags (Restaurant, Bar ...) sprengen eine einzelne
// Overpass-Abfrage. Bei Fehlschlag wird der Radius räumlich geviertelt.
async function fetchArea(
  lat: number, lon: number, radiusM: number, k: string, v: string, label: string, depth = 0,
): Promise<any[] | null> {
  const heavy = ['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'bakery'].includes(v);
  const splitFirst = heavy && radiusM > 8000 && depth < 2;
  if (!splitFirst) {
    const direct = await fetchOverpass(buildQuery(lat, lon, radiusM, k, v), `${label}/d${depth}`);
    if (direct) return direct;
  }
  if (depth >= 2 || radiusM <= 2500) return null;

  const r = radiusM / 2;
  const dLat = (r / 111_320);
  const dLon = r / (111_320 * Math.cos((lat * Math.PI) / 180));
  const out: any[] = [];
  const seen = new Set<number>();
  for (const [sLat, sLon] of [
    [lat + dLat / 2, lon + dLon / 2], [lat + dLat / 2, lon - dLon / 2],
    [lat - dLat / 2, lon + dLon / 2], [lat - dLat / 2, lon - dLon / 2],
  ]) {
    await sleep(REQUEST_DELAY_MS);
    const part = await fetchArea(sLat, sLon, r, k, v, `${label}#`, depth + 1);
    if (part === null) return null;
    for (const el of part) {
      if (seen.has(el.id)) continue;
      seen.add(el.id);
      out.push(el);
    }
  }
  return out;
}

// Alle Mirrors der Reihe nach (rotierender Start), zwei Runden mit
// wachsender Wartezeit. Überlastungs-Codes (429/504/503) sind normal.
async function fetchOverpass(query: string, label: string): Promise<any[] | null> {
  const total = OVERPASS_MIRRORS.length;
  const rounds = 2;
  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < total; i++) {
      const mirror = OVERPASS_MIRRORS[(mirrorCursor + i) % total];
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 25_000);
        const resp = await fetch(mirror, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': OVERPASS_USER_AGENT },
          body: `data=${encodeURIComponent(query)}`,
          signal: ctrl.signal,
        });
        clearTimeout(t);
        if (resp.ok) {
          const data = await resp.json();
          // Erfolgreichen Mirror für den nächsten Aufruf bevorzugen.
          mirrorCursor = (mirrorCursor + i) % total;
          return (data?.elements ?? []) as any[];
        }
        await resp.body?.cancel();
        console.warn(`overpass ${label}: ${mirror} HTTP ${resp.status}`);
        if (resp.status === 429 || resp.status === 504 || resp.status === 503) {
          await sleep(600 + round * 1_200);
        }
      } catch (err) {
        console.warn(`overpass ${label}: ${mirror}`, err instanceof Error ? err.message : String(err));
      }
    }
    // Nach einer kompletten Runde etwas Luft lassen, dann erneut versuchen.
    if (round + 1 < rounds) {
      mirrorCursor = (mirrorCursor + 1) % total;
      await sleep(2_000);
    }
  }
  return null;
}

function cuisineFor(tags: Record<string, string>): { cuisine: string; venueTags: string[] } | null {
  const a = tags.amenity, l = tags.leisure, t = tags.tourism, s = tags.sport, h = tags.historic, sh = tags.shop;
  if (a === 'restaurant') {
    const kitchen = (tags.cuisine || '').split(';')[0].replace(/_/g, ' ').trim();
    return {
      cuisine: kitchen ? kitchen.charAt(0).toUpperCase() + kitchen.slice(1) : 'Restaurant',
      venueTags: ['restaurant', 'food', 'dining', 'essen', ...(kitchen ? [kitchen] : [])],
    };
  }
  const map: Record<string, [string, string[]]> = {
    'amenity:cafe': ['Café', ['cafe', 'coffee', 'food', 'brunch', 'daytime']],
    'amenity:fast_food': ['Fast Food', ['fast-food-restaurant', 'food', 'casual']],
    'amenity:ice_cream': ['Ice Cream', ['ice_cream', 'eisdiele', 'food', 'dessert']],
    'amenity:food_court': ['Food Court', ['food', 'street food', 'casual']],
    'shop:bakery': ['Bakery', ['bakery', 'food', 'brunch', 'dessert']],
    'shop:pastry': ['Bakery', ['bakery', 'food', 'dessert']],
    'shop:confectionery': ['Bakery', ['bakery', 'food', 'dessert']],
    'shop:deli': ['Deli', ['deli', 'food', 'casual']],
    'shop:coffee': ['Coffee Shop', ['coffee', 'cafe', 'food', 'daytime']],
    'tourism:museum': ['Museum', ['museum', 'cultural', 'arts-entertainment', 'daytime']],
    'tourism:gallery': ['Gallery', ['gallery', 'cultural', 'arts-entertainment']],
    'tourism:aquarium': ['Aquarium', ['aquarium', 'cultural', 'family', 'daytime']],
    'tourism:zoo': ['Zoo', ['zoo', 'tierpark', 'family', 'daytime']],
    'tourism:theme_park': ['Theme Park', ['theme park', 'family', 'fun', 'active']],
    'tourism:attraction': ['Attraction', ['attraction', 'sightseeing', 'cultural']],
    'amenity:theatre': ['Theater', ['theatre', 'cultural', 'arts-entertainment', 'evening']],
    'amenity:cinema': ['Cinema', ['cinema', 'kino', 'entertainment', 'evening']],
    'amenity:arts_centre': ['Arts Centre', ['arts-entertainment', 'cultural']],
    'amenity:concert_hall': ['Concert Hall', ['concert hall', 'cultural', 'evening']],
    'amenity:planetarium': ['Planetarium', ['planetarium', 'cultural']],
    'amenity:library': ['Library', ['library', 'cultural', 'quiet']],
    'amenity:exhibition_centre': ['Exhibition', ['exhibition', 'cultural']],
    'historic:castle': ['Historic', ['historic', 'cultural', 'sightseeing']],
    'leisure:bowling_alley': ['Bowling', ['bowling', 'active', 'fun']],
    'leisure:miniature_golf': ['Mini Golf', ['minigolf', 'active', 'fun']],
    'leisure:amusement_arcade': ['Arcade', ['arcade', 'fun', 'active']],
    'leisure:escape_game': ['Escape Room', ['escape room', 'fun', 'active']],
    'leisure:climbing': ['Climbing', ['climbing', 'klettern', 'active', 'sport']],
    'sport:climbing': ['Climbing', ['climbing', 'klettern', 'active', 'sport']],
    'sport:bouldering': ['Climbing', ['bouldering', 'boulderhalle', 'active', 'sport']],
    'leisure:swimming_pool': ['Swimming', ['swimming', 'active']],
    'leisure:water_park': ['Water Park', ['aquapark', 'active', 'fun']],
    'leisure:spa': ['Spa & Wellness', ['spa', 'wellness', 'relaxing']],
    'leisure:sauna': ['Spa & Wellness', ['sauna', 'wellness', 'relaxing']],
    'leisure:ice_rink': ['Ice Rink', ['eislaufen', 'active', 'fun']],
    'leisure:trampoline_park': ['Trampoline Park', ['trampolin', 'active', 'fun']],
    'leisure:adventure_park': ['Adventure Park', ['kletterpark', 'active', 'outdoor']],
    'leisure:horse_riding': ['Horse Riding', ['reiten', 'active', 'outdoor']],
    'leisure:dance': ['Dance', ['tanzschule', 'active', 'social']],
    'sport:go_kart': ['Go-Kart', ['kart', 'active', 'fun']],
    'sport:paintball': ['Paintball', ['paintball', 'active', 'fun']],
    'sport:laser_tag': ['Laser Tag', ['lasertag', 'active', 'fun']],
    'sport:billiards': ['Pub Sport', ['billiards', 'fun', 'social']],
    'sport:darts': ['Pub Sport', ['darts', 'fun', 'social']],
    'sport:surfing': ['Watersport', ['surfing', 'active', 'outdoor']],
    'sport:sailing': ['Watersport', ['sailing', 'active', 'outdoor']],
    'amenity:cooking_school': ['Cooking School', ['kochkurs', 'workshop', 'creative']],
    'amenity:bar': ['Bar', ['bar', 'evening', 'drinks', 'nightlife']],
    'amenity:pub': ['Pub', ['pub', 'evening', 'drinks', 'nightlife']],
    'amenity:nightclub': ['Nightclub', ['nightclub', 'nightlife', 'party']],
    'amenity:biergarten': ['Biergarten', ['biergarten', 'outdoor seating', 'evening']],
    'amenity:casino': ['Casino', ['casino', 'nightlife', 'late night']],
    'amenity:karaoke_box': ['Karaoke', ['karaoke', 'nightlife', 'lively']],
    'amenity:events_venue': ['Events Venue', ['events', 'nightlife', 'party']],
    'shop:shisha': ['Shisha Bar', ['shisha', 'nightlife', 'evening']],
  };
  for (const [key, val] of Object.entries({ amenity: a, leisure: l, tourism: t, sport: s, historic: h, shop: sh })) {
    if (!val) continue;
    const hit = map[`${key}:${val}`];
    if (hit) return { cuisine: hit[0], venueTags: hit[1] };
  }
  return null;
}

function buildAddress(tags: Record<string, string>): string {
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
  const city = [tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(' ');
  if (street && city) return `${street}, ${city}`;
  return street || city || tags['addr:suburb'] || tags['addr:city'] || tags.name || '';
}

// Stabiler Duplikat-Schlüssel: normalisierter Name + auf ~11 m gerundete Koordinaten.
// Muss identisch zur DB-Funktion public.venue_dedupe_key() bleiben.
const UMLAUT_MAP: Record<string, string> = {
  'ä': 'a', 'ö': 'o', 'ü': 'u', 'ß': 's', 'á': 'a', 'à': 'a', 'â': 'a',
  'é': 'e', 'è': 'e', 'ê': 'e', 'í': 'i', 'ì': 'i', 'î': 'i',
  'ó': 'o', 'ò': 'o', 'ô': 'o', 'ú': 'u', 'ù': 'u', 'û': 'u', 'ñ': 'n', 'ç': 'c',
};

function round4(n: number): string {
  return (Math.round(n * 10_000) / 10_000).toString();
}

function dedupeKey(name: string, lat: number, lon: number): string {
  const normalized = name
    .toLowerCase()
    .replace(/[äöüßáàâéèêíìîóòôúùûñç]/g, (c) => UMLAUT_MAP[c] ?? c)
    .replace(/[^a-z0-9]/g, '');
  return `${normalized}@${round4(lat)},${round4(lon)}`;
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  let leaseHeld = false;
  const releaseLease = async () => {
    if (!leaseHeld) return;
    await supabase.from('venue_import_control').update({ lease_until: null }).eq('id', true);
    leaseHeld = false;
  };

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const hop = Number((body as Record<string, unknown>).hop ?? 0) || 0;

    const { data: control } = await supabase
      .from('venue_import_control')
      .select('paused, paused_reason, lease_until, cron_token')
      .eq('id', true)
      .maybeSingle();

    // --- Auth: cron token or admin JWT ---
    const cronToken = req.headers.get('x-cron-token');
    let authorized = Boolean(cronToken && control?.cron_token && cronToken === control.cron_token);
    if (!authorized) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return json({ error: 'Unauthorized' }, 401);
      const { data: userData } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!userData?.user) return json({ error: 'Invalid token' }, 401);
      const { data: roleRow } = await supabase
        .from('user_roles').select('role')
        .eq('user_id', userData.user.id).eq('role', 'admin').maybeSingle();
      if (!roleRow) return json({ error: 'Admin role required' }, 403);
      authorized = true;
    }

    // --- Pause guard at every entry point ---
    if (control?.paused) {
      return json({ skipped: 'paused', reason: control.paused_reason ?? null });
    }

    // --- Single-flight lease ---
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + LEASE_MS).toISOString();
    const { data: leased } = await supabase
      .from('venue_import_control')
      .update({ lease_until: leaseUntil, last_run_at: now.toISOString() })
      .eq('id', true)
      .or(`lease_until.is.null,lease_until.lt.${now.toISOString()}`)
      .select('id')
      .maybeSingle();
    if (!leased) return json({ skipped: 'already_running' });
    leaseHeld = true;

    // --- Fehlgeschlagene Jobs automatisch wieder einreihen ---
    // Overpass-Ausfälle sind temporär; nach einer Abkühlphase erneut versuchen.
    const requeueCutoff = new Date(now.getTime() - REQUEUE_AFTER_MINUTES * 60_000).toISOString();
    const { data: requeued } = await supabase
      .from('venue_import_jobs')
      .update({ status: 'pending', attempts: 0 })
      .eq('status', 'failed')
      .lt('updated_at', requeueCutoff)
      .select('id');
    if (requeued?.length) console.log(`requeued ${requeued.length} failed jobs`);

    // --- Pick next job ---
    const { data: job } = await supabase
      .from('venue_import_jobs')
      .select('*')
      .in('status', ['pending', 'running'])
      .lt('attempts', MAX_ATTEMPTS)
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!job) {
      await releaseLease();
      return json({ done: true, message: 'queue empty' });
    }

    await supabase.from('venue_import_jobs')
      .update({ status: 'running', started_at: job.started_at ?? now.toISOString() })
      .eq('id', job.id);

    const tags = CATEGORY_TAGS[job.category as CategoryId] ?? [];
    const radiusM = Number(job.radius_km) * 1000;
    const deadline = Date.now() + RUN_BUDGET_MS;
    let offset = Number(job.chunk_offset) || 0;
    let fetched = 0;
    let saved = 0;
    let failure: string | null = null;

    while (offset < tags.length && Date.now() < deadline) {
      const [k, v] = tags[offset];
      const elements = await fetchArea(
        Number(job.latitude), Number(job.longitude), radiusM, k, v,
        `${job.city}/${job.category}/${k}=${v}`,
      );
      if (elements === null) {
        failure = `Overpass nicht erreichbar (${k}=${v})`;
        // Hat dieser Job schon oft gehakt, wird der Problem-Tag übersprungen,
        // damit die restlichen Kategorien der Stadt trotzdem durchlaufen.
        if (Number(job.attempts) >= 4) {
          offset += 1;
          await supabase.from('venue_import_jobs')
            .update({ chunk_offset: offset, last_error: `${failure} – übersprungen` })
            .eq('id', job.id);
          await sleep(REQUEST_DELAY_MS);
          failure = null;
          continue;
        }
        break;
      }

      const venues = elements
        .map((el: any) => {
          const t = (el.tags || {}) as Record<string, string>;
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          const meta = cuisineFor(t);
          if (!t.name || !lat || !lon || !meta) return null;
          const address = buildAddress(t);
          if (!address) return null;
          return {
            id: `osm_${el.id}`,
            name: t.name.slice(0, 200),
            address: address.slice(0, 300),
            latitude: lat,
            longitude: lon,
            cuisine_type: meta.cuisine,
            price_range: '$$',
            description: (t.description || t.note || '').slice(0, 500),
            phone: (t.phone || t['contact:phone'] || '').slice(0, 60),
            website: (t.website || t['contact:website'] || t.url || '').slice(0, 300),
            tags: meta.venueTags,
            source: 'openstreetmap',
            is_active: true,
            updated_at: new Date().toISOString(),
          };
        })
        .filter(Boolean) as Array<Record<string, unknown>>;

      fetched += venues.length;
      for (let i = 0; i < venues.length; i += 100) {
        const chunk = venues.slice(i, i + 100);
        const { error } = await supabase.from('venues').upsert(chunk, { onConflict: 'id' });
        if (error) console.error(`upsert error (${job.city}/${job.category}):`, error.message);
        else saved += chunk.length;
      }

      offset += 1;
      // Fortschritt sofort persistieren -> Wiederaufnahme überspringt erledigte Arbeit
      await supabase.from('venue_import_jobs').update({
        chunk_offset: offset,
        fetched_count: Number(job.fetched_count) + fetched,
        saved_count: Number(job.saved_count) + saved,
      }).eq('id', job.id);

      await sleep(REQUEST_DELAY_MS);
    }

    const finished = offset >= tags.length;
    if (failure) {
      await supabase.from('venue_import_jobs').update({
        status: Number(job.attempts) + 1 >= MAX_ATTEMPTS ? 'failed' : 'pending',
        attempts: Number(job.attempts) + 1,
        last_error: failure,
      }).eq('id', job.id);
    } else if (finished) {
      await supabase.from('venue_import_jobs').update({
        status: 'done', finished_at: new Date().toISOString(), last_error: null,
      }).eq('id', job.id);
    }

    await releaseLease();

    // --- Gated self-continuation ---
    const { count: remaining } = await supabase
      .from('venue_import_jobs')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'running'])
      .lt('attempts', MAX_ATTEMPTS);

    let nextHop = false;
    if ((remaining ?? 0) > 0 && hop < MAX_HOPS && control?.cron_token) {
      nextHop = true;
      await sleep(HOP_COOLDOWN_MS);
      fetch(`${supabaseUrl}/functions/v1/venue-import-worker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-cron-token': control.cron_token },
        body: JSON.stringify({ hop: hop + 1 }),
      }).catch(async (err) => {
        console.error('self-invoke failed:', err instanceof Error ? err.message : String(err));
        await supabase.from('venue_import_jobs')
          .update({ last_error: 'Fortsetzung fehlgeschlagen' })
          .eq('id', job.id);
      });
    }

    return json({
      success: true,
      job: { city: job.city, category: job.category, chunk_offset: offset, of: tags.length },
      fetched, saved, finished, failure, hop, remaining_jobs: remaining ?? 0, continued: nextHop,
    });
  } catch (err) {
    await releaseLease();
    const msg = err instanceof Error ? err.message : String(err);
    console.error('venue-import-worker error:', msg);
    return json({ error: msg }, 500);
  }
});
