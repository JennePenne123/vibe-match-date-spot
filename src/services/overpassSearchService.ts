/**
 * Client-side Overpass API (OpenStreetMap) search — completely free, no API key needed.
 * Bypasses edge functions by calling Overpass directly and saving to Supabase.
 */
import { supabase } from '@/integrations/supabase/client';

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

const EXCLUDED_TYPES = new Set([
  'supermarket', 'convenience', 'fuel', 'car_rental', 'bicycle_rental',
  'pharmacy', 'bank', 'atm', 'post_office', 'hospital', 'clinic',
  'dentist', 'veterinary', 'car_wash', 'car_repair', 'laundry',
]);

function buildOverpassQuery(lat: number, lng: number, radius: number, limit: number): string {
  const r = Math.min(radius, 25000);
  return `[out:json][timeout:20];(
    node["amenity"="restaurant"](around:${r},${lat},${lng});
    node["amenity"="cafe"](around:${r},${lat},${lng});
    node["amenity"="bar"](around:${r},${lat},${lng});
    way["amenity"="restaurant"](around:${r},${lat},${lng});
    way["amenity"="cafe"](around:${r},${lat},${lng});
    way["amenity"="bar"](around:${r},${lat},${lng});
    node["amenity"="theatre"](around:${r},${lat},${lng});
    node["tourism"="museum"](around:${r},${lat},${lng});
    node["amenity"="cinema"](around:${r},${lat},${lng});
    node["leisure"="bowling_alley"](around:${r},${lat},${lng});
    node["amenity"="nightclub"](around:${r},${lat},${lng});
  );out center body ${limit};`;
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
  if (tags.amenity === 'nightclub') return 'Nightclub';
  return 'Restaurant';
}

function buildAddress(tags: Record<string, string>): string {
  const parts = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean);
  const cityParts = [tags['addr:postcode'], tags['addr:city']].filter(Boolean);
  if (parts.length > 0 && cityParts.length > 0) return `${parts.join(' ')}, ${cityParts.join(' ')}`;
  if (parts.length > 0) return parts.join(' ');
  if (cityParts.length > 0) return cityParts.join(' ');
  return tags.name || 'Address unknown';
}

function extractTags(tags: Record<string, string>): string[] {
  const result: string[] = [];
  
  // Basic type tags
  if (tags.cuisine) result.push(...tags.cuisine.split(';').map(c => c.trim().replace(/_/g, ' ')));
  if (tags.amenity) result.push(tags.amenity.replace(/_/g, ' '));
  if (tags.leisure) result.push(tags.leisure.replace(/_/g, ' '));
  if (tags.tourism) result.push(tags.tourism.replace(/_/g, ' '));

  // Dietary tags — critical for scoring
  if (tags['diet:vegan'] === 'yes' || tags['diet:vegan'] === 'only') result.push('vegan');
  if (tags['diet:vegetarian'] === 'yes' || tags['diet:vegetarian'] === 'only') result.push('vegetarian');
  if (tags['diet:gluten_free'] === 'yes') result.push('gluten free');
  if (tags['diet:halal'] === 'yes') result.push('halal');
  if (tags['diet:kosher'] === 'yes') result.push('kosher');
  if (tags['diet:lactose_free'] === 'yes') result.push('lactose free');

  // Seating & atmosphere — maps to vibes
  if (tags.outdoor_seating === 'yes') result.push('outdoor seating', 'terrasse');
  if (tags.indoor_seating === 'yes') result.push('indoor');
  if (tags.beer_garden === 'yes' || tags.biergarten === 'yes') result.push('biergarten', 'outdoor seating');

  // Vibe inference from amenity type
  const amenity = tags.amenity || '';
  const cuisine = (tags.cuisine || '').toLowerCase();
  if (amenity === 'cafe' || amenity === 'coffee_shop') result.push('casual', 'cozy', 'gemütlich');
  if (amenity === 'bar') result.push('evening', 'drinks', 'nightlife');
  if (amenity === 'nightclub') result.push('nightlife', 'party', 'lively');
  if (amenity === 'restaurant') result.push('dining');
  if (amenity === 'fast_food') result.push('casual', 'quick');
  if (amenity === 'theatre') result.push('cultural', 'evening', 'entertainment');
  if (amenity === 'cinema') result.push('entertainment', 'evening');
  if (tags.tourism === 'museum') result.push('cultural', 'art', 'daytime');
  if (tags.leisure === 'bowling_alley') result.push('active', 'fun', 'entertainment');

  // Infer vibes from cuisine type
  if (cuisine.includes('italian') || cuisine.includes('french')) result.push('romantic');
  if (cuisine.includes('fine') || cuisine.includes('gourmet')) result.push('upscale', 'elegant');
  if (cuisine.includes('burger') || cuisine.includes('pizza') || cuisine.includes('kebab')) result.push('casual');
  if (cuisine.includes('sushi') || cuisine.includes('japanese')) result.push('trendy');
  if (cuisine.includes('indian') || cuisine.includes('thai') || cuisine.includes('vietnamese')) result.push('exotic');

  // Wheelchair / accessibility
  if (tags.wheelchair === 'yes') result.push('wheelchair accessible', 'barrierearm');
  
  // Opening hours hint for time matching
  if (tags.opening_hours) {
    const oh = tags.opening_hours.toLowerCase();
    if (oh.includes('24') || oh.includes('00:00-24:00')) result.push('late night');
    if (/\b(sa|su|so)\b/.test(oh) && /\b(10|11):00/.test(oh)) result.push('brunch');
  }

  // Stars / quality signals
  if (tags.stars || tags['cuisine:michelin']) result.push('upscale', 'fine dining');
  
  // Smoking
  if (tags.smoking === 'no' || tags.smoking === 'outside') result.push('non-smoking');

  return [...new Set(result)];
}

/**
 * Infer a more accurate price_range from OSM tags instead of defaulting to '$$'
 */
function inferPriceRange(tags: Record<string, string>): string {
  const cuisine = (tags.cuisine || '').toLowerCase();
  const amenity = tags.amenity || '';
  const name = (tags.name || '').toLowerCase();
  
  // Expensive signals
  if (cuisine.includes('fine') || cuisine.includes('gourmet') || tags.stars || 
      name.includes('sterne') || name.includes('gourmet')) return '$$$';
  if (cuisine.includes('steak') || cuisine.includes('sushi') || cuisine.includes('french')) return '$$$';
  
  // Cheap signals
  if (amenity === 'fast_food' || cuisine.includes('kebab') || cuisine.includes('döner') ||
      cuisine.includes('pizza') || amenity === 'ice_cream') return '$';
  if (cuisine.includes('burger') && !name.includes('gourmet')) return '$';
  
  // Mid-range (cafes, most restaurants)
  if (amenity === 'cafe') return '$$';
  
  return '$$';
}

export interface OverpassSearchResult {
  venues: any[];
  count: number;
  source: string;
}

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];

async function fetchWithMirrorRotation(query: string): Promise<any> {
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      console.log(`🗺️ OVERPASS CLIENT: Trying ${mirror}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(mirror, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok) {
        console.log(`✅ OVERPASS CLIENT: Mirror ${mirror} succeeded`);
        return await response.json();
      }
      await response.text(); // consume body
      console.warn(`⚠️ OVERPASS CLIENT: Mirror ${mirror} returned ${response.status}`);
      if (response.status === 429 || response.status >= 500) continue;
      throw new Error(`Overpass error: ${response.status}`);
    } catch (err: any) {
      if (err.name === 'AbortError') { console.warn(`⚠️ OVERPASS CLIENT: ${mirror} timed out`); continue; }
      if (err.message?.startsWith('Overpass error')) throw err;
      continue;
    }
  }
  console.error('🔴 OVERPASS CLIENT: All mirrors failed');
  return null;
}

export async function searchVenuesOverpass(
  lat: number,
  lng: number,
  radiusMeters: number = 5000,
  cuisines: string[] = [],
  limit: number = 40
): Promise<OverpassSearchResult> {
  console.log('🗺️ OVERPASS CLIENT: Searching venues at', { lat, lng, radiusMeters });

  const query = buildOverpassQuery(lat, lng, radiusMeters, Math.min(limit * 2, 80));
  const data = await fetchWithMirrorRotation(query);

  if (!data) {
    console.warn('🔶 OVERPASS CLIENT: All mirrors unavailable, returning empty');
    return { venues: [], count: 0, source: 'openstreetmap' };
  }
  const elements = data.elements || [];
  console.log('✅ OVERPASS CLIENT: Raw results:', elements.length);

  // Filter
  const filtered = elements.filter((el: any) => {
    if (!el.tags?.name) return false;
    const shop = el.tags.shop || '';
    const amenity = el.tags.amenity || '';
    if (EXCLUDED_TYPES.has(shop) || EXCLUDED_TYPES.has(amenity)) return false;
    return true;
  });

  // Cuisine filter
  const osmCuisineValues = cuisines.flatMap(c => CUISINE_TO_OSM[c] || []);
  let matched = filtered;
  if (osmCuisineValues.length > 0) {
    const cuisineMatched = filtered.filter((el: any) => {
      const venueCuisine = (el.tags.cuisine || '').toLowerCase();
      return osmCuisineValues.some(c => venueCuisine.includes(c));
    });
    if (cuisineMatched.length >= 3) matched = cuisineMatched;
  }

  const venues = matched.slice(0, limit).map((el: any) => {
    const tags = el.tags || {};
    const venueLat = el.lat || el.center?.lat;
    const venueLon = el.lon || el.center?.lon;

    return {
      id: `osm_${el.id}`,
      name: tags.name,
      address: buildAddress(tags),
      latitude: venueLat,
      longitude: venueLon,
      cuisine_type: extractCuisineType(tags),
      price_range: inferPriceRange(tags),
      rating: null,
      description: tags.description || tags.note || '',
      phone: tags.phone || tags['contact:phone'] || '',
      website: tags.website || tags['contact:website'] || tags.url || '',
      tags: extractTags(tags),
      source: 'openstreetmap',
      is_active: true,
    };
  });

  console.log('✅ OVERPASS CLIENT: Processed', venues.length, 'venues');

  // Save to database (upsert)
  if (venues.length > 0) {
    const upsertData = venues.map(v => ({
      id: v.id,
      name: v.name,
      address: v.address,
      latitude: v.latitude,
      longitude: v.longitude,
      cuisine_type: v.cuisine_type,
      price_range: v.price_range,
      rating: v.rating,
      description: v.description,
      phone: v.phone,
      website: v.website,
      tags: v.tags,
      source: 'openstreetmap',
      is_active: true,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('venues')
      .upsert(upsertData, { onConflict: 'id' });

    if (error) {
      console.error('⚠️ OVERPASS CLIENT: DB save error:', error.message);
    } else {
      console.log('✅ OVERPASS CLIENT: Saved', venues.length, 'venues to DB');
    }
  }

  return { venues, count: venues.length, source: 'openstreetmap' };
}
