import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders } from '../_shared/cors.ts';
import { checkRateLimitWithLogging, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rate-limiter.ts';

/**
 * Overpass API (OpenStreetMap) — completely free, no API key needed.
 * Uses mirror rotation for resilience against rate limits and downtime.
 */

// Multiple free Overpass mirrors for failover
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

// Map cuisine preferences to OSM cuisine tags
const CUISINE_TO_OSM: Record<string, string[]> = {
  'Italian': ['italian', 'pizza'],
  'Pizza': ['pizza'],
  'Asian': ['asian', 'chinese', 'japanese', 'thai', 'vietnamese', 'korean'],
  'Chinese': ['chinese'],
  'Japanese': ['japanese', 'sushi'],
  'Thai': ['thai'],
  'Mexican': ['mexican', 'tex-mex'],
  'American': ['american', 'burger'],
  'Cafe': ['coffee_shop'],
  'Coffee': ['coffee_shop'],
  'Bakery': ['bakery'],
  'French': ['french'],
  'Indian': ['indian', 'curry'],
  'Mediterranean': ['mediterranean', 'greek', 'turkish'],
  'Seafood': ['seafood', 'fish'],
  'Steakhouse': ['steak_house'],
  'Vegetarian': ['vegetarian', 'vegan'],
  'Burger': ['burger'],
  'German': ['german'],
  'Korean': ['korean'],
  'Vietnamese': ['vietnamese'],
  'Greek': ['greek'],
  'Turkish': ['turkish', 'kebab'],
  'Spanish': ['spanish', 'tapas'],
};

// Map venue types to OSM amenity/leisure tags
const VENUE_TYPE_TO_OSM: Record<string, { key: string; value: string }[]> = {
  'museum': [{ key: 'tourism', value: 'museum' }],
  'gallery': [{ key: 'tourism', value: 'gallery' }],
  'theater_venue': [{ key: 'amenity', value: 'theatre' }],
  'cinema': [{ key: 'amenity', value: 'cinema' }],
  'concert_hall': [{ key: 'amenity', value: 'concert_hall' }],
  'bowling': [{ key: 'leisure', value: 'bowling_alley' }],
  'swimming': [{ key: 'leisure', value: 'swimming_pool' }],
  'spa_wellness': [{ key: 'leisure', value: 'spa' }, { key: 'amenity', value: 'spa' }],
  'climbing': [{ key: 'leisure', value: 'climbing' }, { key: 'sport', value: 'climbing' }],
  'mini_golf': [{ key: 'leisure', value: 'miniature_golf' }],
  'arcade': [{ key: 'leisure', value: 'amusement_arcade' }],
  'karaoke': [{ key: 'amenity', value: 'karaoke_box' }],
  'comedy_club': [{ key: 'amenity', value: 'nightclub' }],
  'escape_room': [{ key: 'leisure', value: 'escape_game' }],
};

// Map activities to OSM tags
const ACTIVITY_TO_OSM: Record<string, { key: string; value: string }[]> = {
  'cocktails': [{ key: 'amenity', value: 'bar' }],
  'cultural_act': [{ key: 'tourism', value: 'museum' }, { key: 'amenity', value: 'theatre' }],
  'active': [{ key: 'leisure', value: 'sports_centre' }, { key: 'leisure', value: 'fitness_centre' }],
  'nightlife_act': [{ key: 'amenity', value: 'nightclub' }, { key: 'amenity', value: 'bar' }],
};

// Excluded venues (supermarkets, delivery, bike rental, etc.)
const EXCLUDED_TYPES = new Set([
  'supermarket', 'convenience', 'fuel', 'car_rental', 'bicycle_rental',
  'pharmacy', 'bank', 'atm', 'post_office', 'hospital', 'clinic',
  'dentist', 'veterinary', 'car_wash', 'car_repair', 'laundry',
]);

function buildOverpassQuery(
  lat: number, lng: number, radius: number,
  cuisines: string[], venueTypes: string[], activities: string[], limit: number
): string {
  const r = Math.min(radius, 50000);
  const parts: string[] = [];

  parts.push(`node["amenity"="restaurant"](around:${r},${lat},${lng});`);
  parts.push(`node["amenity"="cafe"](around:${r},${lat},${lng});`);
  parts.push(`node["amenity"="bar"](around:${r},${lat},${lng});`);
  parts.push(`way["amenity"="restaurant"](around:${r},${lat},${lng});`);
  parts.push(`way["amenity"="cafe"](around:${r},${lat},${lng});`);
  parts.push(`way["amenity"="bar"](around:${r},${lat},${lng});`);

  for (const vt of venueTypes) {
    const osmTags = VENUE_TYPE_TO_OSM[vt];
    if (osmTags) {
      for (const tag of osmTags) {
        parts.push(`node["${tag.key}"="${tag.value}"](around:${r},${lat},${lng});`);
        parts.push(`way["${tag.key}"="${tag.value}"](around:${r},${lat},${lng});`);
      }
    }
  }

  for (const act of activities) {
    const osmTags = ACTIVITY_TO_OSM[act];
    if (osmTags) {
      for (const tag of osmTags) {
        parts.push(`node["${tag.key}"="${tag.value}"](around:${r},${lat},${lng});`);
        parts.push(`way["${tag.key}"="${tag.value}"](around:${r},${lat},${lng});`);
      }
    }
  }

  return `[out:json][timeout:20];(${parts.join('')});out center body ${limit};`;
}

/**
 * Try each Overpass mirror in order until one succeeds.
 * Returns the parsed JSON response or throws after all mirrors fail.
 */
async function fetchWithMirrorRotation(query: string): Promise<any> {
  const errors: string[] = [];

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      console.log(`🗺️ OVERPASS: Trying mirror ${mirror}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 18000); // 18s timeout

      const response = await fetch(mirror, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ OVERPASS: Mirror ${mirror} succeeded`);
        return data;
      }

      // Consume body to avoid resource leak
      const errorText = await response.text();
      const status = response.status;
      errors.push(`${mirror}: HTTP ${status}`);
      console.warn(`⚠️ OVERPASS: Mirror ${mirror} returned ${status}`);

      // 429 or 5xx → try next mirror immediately
      if (status === 429 || status >= 500) continue;

      // Other errors (4xx) are likely our fault, don't retry
      throw new Error(`Overpass query error: ${status} - ${errorText.slice(0, 200)}`);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        errors.push(`${mirror}: timeout`);
        console.warn(`⚠️ OVERPASS: Mirror ${mirror} timed out`);
        continue;
      }
      // Re-throw non-retryable errors
      if (err.message?.startsWith('Overpass query error')) throw err;
      errors.push(`${mirror}: ${err.message}`);
      continue;
    }
  }

  // All mirrors failed — return fallback signal instead of throwing
  console.error(`🔴 OVERPASS: All mirrors failed: ${errors.join(' | ')}`);
  return { _allMirrorsFailed: true, errors };
}

function extractCuisineType(tags: Record<string, string>): string {
  if (tags.cuisine) {
    const first = tags.cuisine.split(';')[0].trim();
    return first.charAt(0).toUpperCase() + first.slice(1).replace(/_/g, ' ');
  }
  if (tags.amenity === 'cafe') return 'Café';
  if (tags.amenity === 'bar') return 'Bar';
  if (tags.amenity === 'fast_food') return 'Fast Food';
  if (tags.tourism === 'museum') return 'Museum';
  if (tags.amenity === 'theatre') return 'Theater';
  if (tags.amenity === 'cinema') return 'Cinema';
  if (tags.leisure === 'bowling_alley') return 'Bowling';
  if (tags.leisure === 'swimming_pool') return 'Swimming';
  if (tags.leisure === 'spa' || tags.amenity === 'spa') return 'Spa & Wellness';
  if (tags.leisure === 'miniature_golf') return 'Mini Golf';
  if (tags.amenity === 'nightclub') return 'Nightclub';
  return 'Restaurant';
}

function extractPriceRange(tags: Record<string, string>): string {
  if (tags['diet:vegan'] === 'only' || tags['diet:vegetarian'] === 'only') return '$';
  if (tags.cuisine?.includes('fine_dining')) return '$$$$';
  if (tags.amenity === 'fast_food') return '$';
  return '$$';
}

function buildAddress(tags: Record<string, string>): string {
  const parts = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean);
  const cityParts = [tags['addr:postcode'], tags['addr:city']].filter(Boolean);
  if (parts.length > 0 && cityParts.length > 0) return `${parts.join(' ')}, ${cityParts.join(' ')}`;
  if (parts.length > 0) return parts.join(' ');
  if (cityParts.length > 0) return cityParts.join(' ');
  return '';
}

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

function extractTags(tags: Record<string, string>): string[] {
  const result: string[] = [];
  if (tags.cuisine) result.push(...tags.cuisine.split(';').map(c => c.trim().replace(/_/g, ' ')));
  if (tags.amenity) result.push(tags.amenity.replace(/_/g, ' '));
  if (tags.leisure) result.push(tags.leisure.replace(/_/g, ' '));
  if (tags.tourism) result.push(tags.tourism.replace(/_/g, ' '));
  if (tags['diet:vegan'] === 'yes' || tags['diet:vegan'] === 'only') result.push('vegan');
  if (tags['diet:vegetarian'] === 'yes' || tags['diet:vegetarian'] === 'only') result.push('vegetarian');
  if (tags.outdoor_seating === 'yes') result.push('outdoor seating');
  if (tags.wheelchair === 'yes') result.push('wheelchair accessible');
  if (tags.internet_access === 'wlan' || tags.internet_access === 'yes') result.push('wifi');
  return [...new Set(result)];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = await checkRateLimitWithLogging(identifier, 'search-venues-overpass', RATE_LIMITS.EXTERNAL_API, req);
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(corsHeaders);
  }

  try {
    const { latitude, longitude, cuisines = [], radius = 5000, limit = 20, venueTypes = [], activities = [] } = await req.json();

    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required');
    }

    console.log('🗺️ OVERPASS: Searching venues', { latitude, longitude, cuisines, venueTypes, activities, radius, limit });

    const query = buildOverpassQuery(latitude, longitude, radius, cuisines, venueTypes, activities, Math.min(limit * 2, 60));
    const data = await fetchWithMirrorRotation(query);

    // All mirrors failed → graceful degradation (return 200 with fallback signal)
    if (data._allMirrorsFailed) {
      console.warn('🔶 OVERPASS: All mirrors unavailable, returning fallback signal');
      return new Response(
        JSON.stringify({
          venues: [],
          count: 0,
          fallback: true,
          error: 'OVERPASS_ALL_MIRRORS_UNAVAILABLE',
          message: 'All Overpass mirrors are currently unavailable. Using cached data.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const elements = data.elements || [];
    console.log('✅ OVERPASS: Raw results:', elements.length);

    // Filter
    const filtered = elements.filter((el: any) => {
      if (!el.tags?.name) return false;
      const shop = el.tags.shop || '';
      const amenity = el.tags.amenity || '';
      if (EXCLUDED_TYPES.has(shop) || EXCLUDED_TYPES.has(amenity)) return false;
      return true;
    });

    // Cuisine filter
    const osmCuisineValues = cuisines.flatMap((c: string) => CUISINE_TO_OSM[c] || []);
    let matched = filtered;
    if (osmCuisineValues.length > 0) {
      const cuisineMatched = filtered.filter((el: any) => {
        const venueCuisine = (el.tags.cuisine || '').toLowerCase();
        return osmCuisineValues.some((c: string) => venueCuisine.includes(c));
      });
      if (cuisineMatched.length >= 3) matched = cuisineMatched;
    }

    // Transform
    const venues = matched.slice(0, limit).map((el: any) => {
      const tags = el.tags || {};
      const lat = el.lat || el.center?.lat;
      const lon = el.lon || el.center?.lon;
      return {
        venue_id: `osm_${el.id}`,
        name: tags.name,
        address: buildAddress(tags),
        latitude: lat,
        longitude: lon,
        cuisine_type: extractCuisineType(tags),
        price_range: extractPriceRange(tags),
        rating: 0,
        photos: [],
        description: tags.description || tags.note || '',
        phone: tags.phone || tags['contact:phone'] || '',
        website: tags.website || tags['contact:website'] || tags.url || '',
        opening_hours: tags.opening_hours ? { display: tags.opening_hours } : null,
        tags: extractTags(tags),
        source: 'openstreetmap',
        osm_data: {
          osm_id: el.id, osm_type: el.type,
          wheelchair: tags.wheelchair, outdoor_seating: tags.outdoor_seating,
          internet_access: tags.internet_access, smoking: tags.smoking,
          diet_vegan: tags['diet:vegan'], diet_vegetarian: tags['diet:vegetarian'],
        },
      };
    });

    console.log('✅ OVERPASS: Processed', venues.length, 'venues');

    // Reverse-geocode missing addresses (max 5 to keep response fast)
    let geocodedCount = 0;
    for (const venue of venues) {
      if (geocodedCount >= 5) break;
      if ((!venue.address || venue.address.trim() === '') && venue.latitude && venue.longitude) {
        const addr = await reverseGeocode(venue.latitude, venue.longitude);
        if (addr) { venue.address = addr; geocodedCount++; }
        await new Promise(r => setTimeout(r, 1100));
      }
    }
    if (geocodedCount > 0) {
      console.log(`📍 OVERPASS: Reverse-geocoded ${geocodedCount} addresses`);
    }

    // Save to DB
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    for (const venue of venues) {
      const { error } = await supabase.from('venues').upsert({
        id: venue.venue_id, name: venue.name, address: venue.address,
        latitude: venue.latitude, longitude: venue.longitude,
        cuisine_type: venue.cuisine_type, price_range: venue.price_range,
        rating: venue.rating || null, description: venue.description,
        phone: venue.phone, website: venue.website,
        opening_hours: venue.opening_hours, tags: venue.tags,
        source: 'openstreetmap', is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (error) console.error('🔴 OVERPASS: DB error', venue.name, error.message);
    }

    console.log('✅ OVERPASS: Saved', venues.length, 'venues to DB');

    return new Response(JSON.stringify({ venues, count: venues.length, fallback: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('🔴 OVERPASS: Error:', msg);
    // Graceful degradation: return 200 with fallback signal
    return new Response(
      JSON.stringify({ error: msg, venues: [], count: 0, fallback: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
