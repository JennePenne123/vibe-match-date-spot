import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { checkRateLimitWithLogging, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Radar category mapping for cuisine types
const CUISINE_TO_RADAR_CATEGORIES: Record<string, string> = {
  'Italian': 'italian-restaurant',
  'Pizza': 'pizza-place',
  'Asian': 'asian-restaurant',
  'Chinese': 'chinese-restaurant',
  'Japanese': 'japanese-restaurant',
  'Thai': 'thai-restaurant',
  'Mexican': 'mexican-restaurant',
  'American': 'american-restaurant',
  'Cafe': 'cafe',
  'Coffee': 'coffee-shop',
  'Bakery': 'bakery',
  'Bar': 'bar',
  'French': 'french-restaurant',
  'Indian': 'indian-restaurant',
  'Mediterranean': 'mediterranean-restaurant',
  'Seafood': 'seafood-restaurant',
  'Steakhouse': 'steakhouse',
  'Vegetarian': 'vegetarian-restaurant',
  'Burger': 'burger-joint',
};

// Venue type mapping to Radar categories
const VENUE_TYPE_TO_RADAR: Record<string, string[]> = {
  'museum': ['museum'],
  'gallery': ['art-gallery'],
  'theater_venue': ['theater', 'performing-arts-venue'],
  'cinema': ['movie-theater'],
  'concert_hall': ['music-venue', 'concert-hall'],
  'exhibition': ['museum', 'convention-center'],
  'mini_golf': ['mini-golf-course'],
  'bowling': ['bowling-alley'],
  'escape_room': ['entertainment'],
  'climbing': ['rock-climbing', 'gym'],
  'swimming': ['pool', 'water-park'],
  'hiking': ['trail', 'park'],
  
  'karaoke': ['karaoke-bar'],
  'comedy_club': ['comedy-club'],
  'arcade': ['arcade'],
  'live_event': ['event-space', 'music-venue'],
  'spa_wellness': ['spa', 'gym'],
};

// Activity to Radar categories
const ACTIVITY_TO_RADAR: Record<string, string[]> = {
  'cocktails': ['cocktail-bar', 'wine-bar', 'bar'],
  'cultural_act': ['museum', 'art-gallery', 'theater'],
  'active': ['gym', 'sports-center', 'bowling-alley'],
  'nightlife_act': ['nightclub', 'bar', 'lounge'],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Rate limiting
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = await checkRateLimitWithLogging(identifier, 'search-venues-radar', RATE_LIMITS.EXTERNAL_API, req);
  if (!rateLimitResult.allowed) {
    console.log(`🚫 RADAR: Rate limit ${rateLimitResult.count}/${rateLimitResult.limit}`);
    return rateLimitResponse(corsHeaders);
  }

  try {
    const radarApiKey = Deno.env.get('RADAR_API_KEY');
    if (!radarApiKey) {
      console.error('❌ RADAR: API key not configured');
      return new Response(
        JSON.stringify({ error: 'RADAR_API_KEY not configured', venues: [], count: 0 }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { latitude, longitude, cuisines, radius = 5000, limit = 20, venueTypes = [], activities = [] } = await req.json();

    // Validate coordinates
    const validLat = parseFloat(latitude);
    const validLng = parseFloat(longitude);
    if (isNaN(validLat) || isNaN(validLng) || validLat < -90 || validLat > 90 || validLng < -180 || validLng > 180) {
      return new Response(
        JSON.stringify({ error: 'Invalid coordinates', venues: [], count: 0 }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validRadius = Math.min(Math.max(parseInt(String(radius)) || 5000, 500), 25000);
    const validLimit = Math.min(Math.max(parseInt(String(limit)) || 20, 1), 100);

    console.log('🔍 RADAR: Searching venues', { latitude: validLat, longitude: validLng, cuisines, venueTypes, activities, radius: validRadius, limit: validLimit });

    // Map cuisines to Radar categories
    const sanitizedCuisines = Array.isArray(cuisines)
      ? cuisines.slice(0, 10).map((c: string) => String(c).replace(/[<>]/g, '').trim().substring(0, 50))
      : [];

    const categories = sanitizedCuisines
      .map((c: string) => CUISINE_TO_RADAR_CATEGORIES[c])
      .filter(Boolean)
      .join(',');

    // Build categories based on user preferences instead of always sending all 28 types
    const preferredCategories = new Set<string>();
    
    // Always include broad restaurant category as baseline
    preferredCategories.add('restaurant');
    
    // Add user's specific cuisine categories (from mapping)
    if (categories) {
      categories.split(',').forEach((c: string) => preferredCategories.add(c));
    }
    
    // If user has no specific cuisine preferences, add common dine-in categories
    if (sanitizedCuisines.length === 0) {
      ['cafe', 'bar', 'coffee-shop', 'bakery', 'bistro', 'pub', 'wine-bar', 'cocktail-bar'].forEach(c => preferredCategories.add(c));
    }

    // Add venue type categories
    const venueTypeCategories = new Set<string>();
    if (Array.isArray(venueTypes)) {
      for (const vt of venueTypes) {
        const radarCats = VENUE_TYPE_TO_RADAR[vt];
        if (radarCats) radarCats.forEach(c => venueTypeCategories.add(c));
      }
    }

    // Add activity categories  
    if (Array.isArray(activities)) {
      for (const act of activities) {
        const radarCats = ACTIVITY_TO_RADAR[act];
        if (radarCats) radarCats.forEach(c => venueTypeCategories.add(c));
      }
    }

    // Merge all categories — only what user actually wants
    const allCategories = [...new Set([...preferredCategories, ...venueTypeCategories])].join(',');

    console.log('📋 RADAR: Targeted categories count:', preferredCategories.size + venueTypeCategories.size, '(preferred:', preferredCategories.size, '+ venueTypes:', venueTypeCategories.size, ')');

    const searchParams = new URLSearchParams({
      near: `${validLat},${validLng}`,
      radius: validRadius.toString(),
      limit: validLimit.toString(),
      categories: allCategories,
    });

    const searchUrl = `https://api.radar.io/v1/search/places?${searchParams}`;
    console.log('📡 RADAR: Request URL:', searchUrl.replace(radarApiKey, '[MASKED]'));

    const startTime = Date.now();
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': radarApiKey,
        'Accept': 'application/json',
      },
    });

    const requestDuration = Date.now() - startTime;
    console.log('⏱️ RADAR: Response in', requestDuration + 'ms, status:', searchResponse.status);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('❌ RADAR: API error', searchResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Radar API error: ${searchResponse.status}`, details: errorText, venues: [], count: 0 }),
        { status: searchResponse.status >= 400 && searchResponse.status < 500 ? 400 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    const places = searchData.places || [];
    console.log('✅ RADAR: Found', places.length, 'places');

    // Blocklist: filter out non-dine-in venues
    const blockedCategories = [
      'grocery', 'supermarket', 'convenience-store', 'gas-station',
      'food-delivery', 'catering', 'food-truck', 'vending-machine',
      'liquor-store', 'discount-store', 'department-store', 'drugstore',
      'market', 'deli', 'butcher', 'wholesale',
    ];
    const blockedNames = [
      'netto', 'aldi', 'lidl', 'rewe', 'edeka', 'penny', 'kaufland',
      'lieferando', 'delivery hero', 'wolt', 'uber eats', 'domino',
      'pizza hut delivery', 'just eat', 'flink', 'gorillas', 'getir',
    ];

    // Transform Radar data to our venue schema
    const venues = places
      .filter((place: any) => {
        const cats = (place.categories || []).map((c: string) => c.toLowerCase());
        const name = (place.name || '').toLowerCase();
        // Exclude if any blocked category or name matches
        const hasBlockedCat = cats.some((cat: string) => 
          blockedCategories.some(b => cat.includes(b))
        );
        const hasBlockedName = blockedNames.some(b => name.includes(b));
        if (hasBlockedCat || hasBlockedName) {
          console.log(`🚫 RADAR: Excluded non-venue: ${place.name}`);
        }
        return !hasBlockedCat && !hasBlockedName;
      })
      .map((place: any) => {
        const cuisineType = determineCuisineType(place, sanitizedCuisines);
        const isChain = !!place.chain;
        const chainName = place.chain?.name || null;

        return {
          venue_id: place._id,
          radar_id: place._id,
          name: place.name,
          address: place.location?.formattedAddress || `${place.location?.addressLabel || ''}, ${place.location?.city || ''}`,
          latitude: place.location?.coordinates?.[1] || place.location?.latitude,
          longitude: place.location?.coordinates?.[0] || place.location?.longitude,
          cuisine_type: cuisineType,
          price_range: '$$',
          rating: 0,
          photos: [],
          description: place.categories?.map((c: string) => c.replace(/-/g, ' ')).join(', ') || '',
          phone: '',
          website: '',
          opening_hours: null,
          tags: place.categories || [],
          chain: chainName,
          is_chain: isChain,
          source: 'radar',
        };
      });

    // Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let savedCount = 0;
    for (const venue of venues) {
      const { error } = await supabase
        .from('venues')
        .upsert({
          id: venue.radar_id,
          name: venue.name,
          address: venue.address,
          latitude: venue.latitude,
          longitude: venue.longitude,
          cuisine_type: venue.cuisine_type,
          price_range: venue.price_range,
          rating: venue.rating,
          description: venue.description,
          tags: venue.tags,
          photos: venue.photos,
          source: 'radar',
          is_active: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      if (error) {
        console.error('⚠️ RADAR: Error saving venue', venue.name, error.message);
      } else {
        savedCount++;
      }
    }

    console.log('✅ RADAR: Saved', savedCount, '/', venues.length, 'venues to database');

    return new Response(
      JSON.stringify({
        venues,
        count: venues.length,
        metadata: {
          source: 'radar',
          search_location: `${validLat},${validLng}`,
          search_radius: validRadius,
          search_cuisines: sanitizedCuisines,
          response_time_ms: requestDuration,
          chains_detected: venues.filter((v: any) => v.is_chain).length,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ RADAR: Critical error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error', venues: [], count: 0 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function determineCuisineType(place: any, preferredCuisines: string[]): string {
  const categories = place.categories || [];
  const name = (place.name || '').toLowerCase();

  // Match against preferred cuisines
  for (const cuisine of preferredCuisines) {
    const lower = cuisine.toLowerCase();
    if (name.includes(lower) || categories.some((cat: string) => cat.toLowerCase().includes(lower))) {
      return cuisine;
    }
  }

  // Map from Radar category
  const categoryMap: Record<string, string> = {
    'italian-restaurant': 'Italian',
    'pizza-place': 'Pizza',
    'asian-restaurant': 'Asian',
    'chinese-restaurant': 'Chinese',
    'japanese-restaurant': 'Japanese',
    'thai-restaurant': 'Thai',
    'mexican-restaurant': 'Mexican',
    'american-restaurant': 'American',
    'cafe': 'Café',
    'coffee-shop': 'Café',
    'bakery': 'Bakery',
    'bar': 'Bar',
    'french-restaurant': 'French',
    'indian-restaurant': 'Indian',
    'mediterranean-restaurant': 'Mediterranean',
    'seafood-restaurant': 'Seafood',
    'steakhouse': 'Steakhouse',
    'burger-joint': 'Burger',
  };

  for (const cat of categories) {
    if (categoryMap[cat]) return categoryMap[cat];
  }

  return 'Restaurant';
}
