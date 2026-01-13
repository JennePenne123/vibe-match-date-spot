import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { checkRateLimitWithLogging, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Foursquare category mapping
const CUISINE_TO_FSQ_CATEGORIES: Record<string, string> = {
  'Italian': '13236',
  'Pizza': '13064',
  'Asian': '13072',
  'Chinese': '13099',
  'Japanese': '13263',
  'Thai': '13352',
  'Mexican': '13303',
  'American': '13031',
  'Cafe': '13035',
  'Coffee': '13034',
  'Bakery': '13002',
  'Bar': '13003',
  'French': '13148',
  'Indian': '13199',
  'Mediterranean': '13304',
  'Seafood': '13338',
  'Steakhouse': '13346',
  'Vegetarian': '13377',
  'Burger': '13028'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting with logging for external API functions
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = await checkRateLimitWithLogging(identifier, 'search-venues-foursquare', RATE_LIMITS.EXTERNAL_API, req);
  if (!rateLimitResult.allowed) {
    console.log(`🚫 FOURSQUARE: Rate limit ${rateLimitResult.count}/${rateLimitResult.limit}`);
    return rateLimitResponse(corsHeaders);
  }

  try {
    const foursquareApiKey = Deno.env.get('FOURSQUARE_API_KEY');
    if (!foursquareApiKey) {
      throw new Error('FOURSQUARE_API_KEY not configured');
    }

    const { latitude, longitude, cuisines, radius = 5000, limit = 20 } = await req.json();

    if (!latitude || !longitude) {
      throw new Error('Latitude and longitude are required');
    }

    console.log('🔍 FOURSQUARE: Searching venues', { latitude, longitude, cuisines, radius, limit });

    // Map cuisines to Foursquare category IDs
    const categoryIds = cuisines
      ?.map((cuisine: string) => CUISINE_TO_FSQ_CATEGORIES[cuisine])
      .filter(Boolean)
      .join(',') || '';

    // Build search parameters
    const searchParams = new URLSearchParams({
      ll: `${latitude},${longitude}`,
      radius: radius.toString(),
      limit: limit.toString(),
      fields: 'fsq_id,name,location,categories,rating,price,photos,hours,tel,website,description,verified,stats',
    });

    if (categoryIds) {
      searchParams.append('categories', categoryIds);
    }

    // Search venues
    const searchUrl = `https://api.foursquare.com/v3/places/search?${searchParams}`;
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': foursquareApiKey,
        'Accept': 'application/json',
      },
    });

    if (!searchResponse.ok) {
      const error = await searchResponse.text();
      console.error('🔴 FOURSQUARE: Search failed', error);
      throw new Error(`Foursquare API error: ${searchResponse.status} - ${error}`);
    }

    const searchData = await searchResponse.json();
    console.log('✅ FOURSQUARE: Found', searchData.results?.length || 0, 'venues');

    // Transform Foursquare data to match our venue schema
    const venues = await Promise.all(
      (searchData.results || []).map(async (place: any) => {
        // Fetch additional details for each venue (photos and tips)
        const detailsPromises = [];
        
        // Get photos
        detailsPromises.push(
          fetch(`https://api.foursquare.com/v3/places/${place.fsq_id}/photos?limit=10`, {
            headers: {
              'Authorization': foursquareApiKey,
              'Accept': 'application/json',
            },
          }).then(r => r.ok ? r.json() : null).catch(() => null)
        );

        // Get tips
        detailsPromises.push(
          fetch(`https://api.foursquare.com/v3/places/${place.fsq_id}/tips?limit=5`, {
            headers: {
              'Authorization': foursquareApiKey,
              'Accept': 'application/json',
            },
          }).then(r => r.ok ? r.json() : null).catch(() => null)
        );

        const [photosData, tipsData] = await Promise.all(detailsPromises);

        // Transform photos
        const photos = photosData?.map((photo: any) => ({
          url: `${photo.prefix}original${photo.suffix}`,
          width: photo.width,
          height: photo.height,
          source: 'foursquare'
        })) || [];

        // Transform tips
        const tips = tipsData?.map((tip: any) => ({
          text: tip.text,
          created_at: tip.created_at,
          agree_count: tip.agree_count
        })) || [];

        // Determine cuisine type
        const cuisineType = place.categories?.[0]?.name || 'Restaurant';

        // Map price tier (Foursquare uses 1-4, we use $-$$$$)
        const priceMap: Record<number, string> = {
          1: '$',
          2: '$$',
          3: '$$$',
          4: '$$$$'
        };
        const priceRange = place.price ? priceMap[place.price] : '$$';

        return {
          venue_id: place.fsq_id,
          foursquare_id: place.fsq_id,
          name: place.name,
          address: place.location?.formatted_address || `${place.location?.address || ''}, ${place.location?.locality || ''}`,
          latitude: place.geocodes?.main?.latitude || place.location?.latitude,
          longitude: place.geocodes?.main?.longitude || place.location?.longitude,
          cuisine_type: cuisineType,
          price_range: priceRange,
          rating: place.rating || 0,
          photos: photos,
          description: place.description || '',
          phone: place.tel || '',
          website: place.website || '',
          opening_hours: place.hours || null,
          tags: place.categories?.map((cat: any) => cat.name) || [],
          foursquare_data: {
            verified: place.verified || false,
            stats: place.stats || {},
            tips: tips,
            categories: place.categories || []
          }
        };
      })
    );

    // Initialize Supabase client to save new venues
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Save venues to database
    for (const venue of venues) {
      const { error } = await supabase
        .from('venues')
        .upsert({
          id: venue.foursquare_id,
          foursquare_id: venue.foursquare_id,
          name: venue.name,
          address: venue.address,
          latitude: venue.latitude,
          longitude: venue.longitude,
          cuisine_type: venue.cuisine_type,
          price_range: venue.price_range,
          rating: venue.rating,
          description: venue.description,
          phone: venue.phone,
          website: venue.website,
          opening_hours: venue.opening_hours,
          tags: venue.tags,
          photos: venue.photos,
          foursquare_data: venue.foursquare_data,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'foursquare_id'
        });

      if (error) {
        console.error('🔴 FOURSQUARE: Error saving venue', venue.name, error);
      }
    }

    console.log('✅ FOURSQUARE: Saved', venues.length, 'venues to database');

    return new Response(JSON.stringify({ venues, count: venues.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('🔴 FOURSQUARE: Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, venues: [], count: 0 }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
