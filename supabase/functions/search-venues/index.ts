import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { checkRateLimitWithLogging, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rate-limiter.ts';

serve(async (req) => {
  console.log('🔍 SEARCH VENUES: ===== FUNCTION START =====');
  console.log('🔍 SEARCH VENUES: Request method:', req.method);
  console.log('🔍 SEARCH VENUES: Timestamp:', new Date().toISOString());

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Rate limiting with logging for external API functions
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = await checkRateLimitWithLogging(identifier, 'search-venues', RATE_LIMITS.EXTERNAL_API, req);
  if (!rateLimitResult.allowed) {
    console.log(`🚫 SEARCH VENUES: Rate limit ${rateLimitResult.count}/${rateLimitResult.limit}`);
    return rateLimitResponse(corsHeaders);
  }

  try {
    // 1. Parse and validate Request Body
    const requestBody = await req.json();
    console.log('📥 SEARCH VENUES: Request body received:', JSON.stringify(requestBody, null, 2));

    const { 
      location, 
      cuisines, 
      originalCuisines,
      latitude, 
      longitude, 
      radius = 5000,
      types = ['restaurant'],
      minRating = 3.0 
    } = requestBody;

    // Input validation and sanitization
    const validLatitude = parseFloat(latitude);
    const validLongitude = parseFloat(longitude);
    const validRadius = Math.min(Math.max(parseInt(radius) || 5000, 1000), 50000); // Limit radius between 1km-50km
    const validTypes = Array.isArray(types) ? types.slice(0, 5) : ['restaurant']; // Limit to 5 types max
    const validMinRating = Math.min(Math.max(parseFloat(minRating) || 3.0, 1.0), 5.0);
    
    // Validate coordinates
    if (isNaN(validLatitude) || isNaN(validLongitude) || 
        validLatitude < -90 || validLatitude > 90 || 
        validLongitude < -180 || validLongitude > 180) {
      console.error('❌ SEARCH VENUES: Invalid coordinates:', { latitude: validLatitude, longitude: validLongitude });
      return Response.json({
        success: false,
        error: 'Invalid coordinates provided',
        details: 'Latitude must be between -90 and 90, longitude between -180 and 180',
        venues: []
      }, { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Sanitize cuisine inputs
    const sanitizedCuisines = Array.isArray(originalCuisines) ? 
      originalCuisines.slice(0, 10).map(c => String(c).replace(/[<>]/g, '').trim().substring(0, 50)) : [];

    // 2. Validate API Key
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    console.log('🔑 SEARCH VENUES: API Key status:', {
      exists: !!apiKey,
      length: apiKey?.length || 0,
      prefix: apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING'
    });

    if (!apiKey) {
      console.error('❌ SEARCH VENUES: No Google Places API key found');
      return Response.json({
        success: false,
        error: 'Google Places API key not configured',
        venues: []
      }, { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Validate Location
    if (!validLatitude || !validLongitude || typeof validLatitude !== 'number' || typeof validLongitude !== 'number') {
      console.error('❌ SEARCH VENUES: Invalid location:', { latitude: validLatitude, longitude: validLongitude });
      return Response.json({
        success: false,
        error: 'Valid latitude and longitude required',
        venues: []
      }, { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Build Google Places Request with validated inputs
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const searchParams = new URLSearchParams({
      location: `${validLatitude},${validLongitude}`,
      radius: validRadius.toString(),
      type: 'restaurant',
      key: apiKey,
      language: 'de'
    });

    // Add cuisine-based keyword search with sanitized inputs
    if (sanitizedCuisines && sanitizedCuisines.length > 0) {
      const keywords = sanitizedCuisines.join(' OR ');
      searchParams.append('keyword', keywords);
      console.log('🔍 SEARCH VENUES: Using keyword search:', keywords);
    }

    const googleUrl = `${baseUrl}?${searchParams.toString()}`;
    console.log('📡 SEARCH VENUES: Google Places URL (masked):', googleUrl.replace(apiKey, '[API_KEY_MASKED]'));

    // 5. Make Google Places API Call
    console.log('📡 SEARCH VENUES: Making API request...');
    const startTime = Date.now();
    
    const response = await fetch(googleUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'VybePulse-App/1.0'
      }
    });
    
    const requestDuration = Date.now() - startTime;
    console.log('⏱️ SEARCH VENUES: API request completed in:', requestDuration + 'ms');
    console.log('📡 SEARCH VENUES: Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ SEARCH VENUES: HTTP Error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      return Response.json({
        success: false,
        error: `Google Places API HTTP error: ${response.status}`,
        details: errorText,
        venues: []
      }, { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 6. Parse Google Places Response
    const placesData = await response.json();
    console.log('📊 SEARCH VENUES: Google Places API Response:', {
      status: placesData.status,
      results_count: placesData.results?.length || 0,
      error_message: placesData.error_message,
      next_page_token: !!placesData.next_page_token
    });

    // 7. Handle Google Places API Errors
    if (placesData.status === 'REQUEST_DENIED') {
      console.error('❌ SEARCH VENUES: REQUEST_DENIED:', placesData.error_message);
      return Response.json({
        success: false,
        error: 'Google Places API access denied',
        details: placesData.error_message || 'Check API key and billing',
        venues: []
      }, { 
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (placesData.status === 'OVER_QUERY_LIMIT') {
      console.error('❌ SEARCH VENUES: OVER_QUERY_LIMIT');
      return Response.json({
        success: false,
        error: 'Google Places API quota exceeded',
        details: 'Daily request limit reached',
        venues: []
      }, { 
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      console.error('❌ SEARCH VENUES: Unexpected status:', placesData.status);
      return Response.json({
        success: false,
        error: `Google Places API error: ${placesData.status}`,
        details: placesData.error_message,
        venues: []
      }, { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 8. Process Results
    const venues = [];
    
    if (placesData.results && placesData.results.length > 0) {
      console.log('🏢 SEARCH VENUES: Processing', placesData.results.length, 'venues...');
      
      for (const place of placesData.results.slice(0, 20)) {
        try {
          const venue = {
            placeId: place.place_id,
            name: place.name,
            location: place.vicinity || place.formatted_address,
            latitude: place.geometry?.location?.lat,
            longitude: place.geometry?.location?.lng,
            rating: place.rating || 4.0,
            priceRange: '€'.repeat(place.price_level || 2),
            // Process photos - get multiple sizes and photos
            photos: place.photos?.slice(0, 5).map((photo: any, index: number) => ({
              url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${index === 0 ? 800 : 400}&photoreference=${photo.photo_reference}&key=${apiKey}`,
              thumbnail: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${photo.photo_reference}&key=${apiKey}`,
              width: photo.width || 400,
              height: photo.height || 300,
              attribution: cleanAttribution(photo.html_attributions?.[0]),
              isGooglePhoto: true
            })) || [],
            // Fallback image for backwards compatibility
            image: place.photos?.[0] ? 
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${apiKey}` :
              'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
            cuisineType: determineCuisineType(place, sanitizedCuisines),
            tags: place.types || ['restaurant'],
            openNow: place.opening_hours?.open_now,
            phone: null,
            website: null,
            description: `${place.name} in ${place.vicinity || 'der Nähe'}`
          };
          
          venues.push(venue);
          
          if (venues.length <= 3) {
            console.log(`🏢 SEARCH VENUES: Venue ${venues.length}:`, {
              name: venue.name,
              location: venue.location,
              rating: venue.rating,
              cuisine: venue.cuisineType
            });
          }
          
        } catch (venueError) {
          const errorMessage = venueError instanceof Error ? venueError.message : 'Unknown error';
          console.warn('⚠️ SEARCH VENUES: Error processing venue:', place.name, errorMessage);
        }
      }
    }

    console.log('✅ SEARCH VENUES: Successfully processed', venues.length, 'venues');
    
    return Response.json({
      success: true,
      venues: venues,
        metadata: {
          total_found: placesData.results?.length || 0,
          search_location: `${validLatitude}, ${validLongitude}`,
          search_radius: validRadius,
          search_cuisines: sanitizedCuisines,
          response_time_ms: requestDuration
        }
    }, { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error('❌ SEARCH VENUES: Critical error:', {
      message: errorObj.message,
      stack: errorObj.stack,
      name: errorObj.name
    });
    
    // Don't expose internal error details in production
    const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
    
    return Response.json({
      success: false,
      error: 'Internal server error',
      details: isDevelopment ? errorObj.message : 'An unexpected error occurred',
      venues: []
    }, { 
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });
  }
});

// Helper function to strip HTML tags from attribution
function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

// Helper function to clean attribution text
function cleanAttribution(attribution: string): string {
  if (!attribution) return 'Google Photos';
  const cleaned = stripHtmlTags(attribution);
  return cleaned || 'Google Photos';
}

function determineCuisineType(place: any, preferredCuisines: string[]): string {
  const types = place.types || [];
  const name = (place.name || '').toLowerCase();
  
  for (const cuisine of preferredCuisines || []) {
    const sanitizedCuisine = String(cuisine).toLowerCase();
    if (name.includes(sanitizedCuisine) || 
        types.some((type: string) => type.includes(sanitizedCuisine))) {
      return cuisine;
    }
  }
  
  if (types.includes('meal_takeaway')) return 'Schnellimbiss';
  if (types.includes('bakery')) return 'Bäckerei';
  if (types.includes('cafe')) return 'Café';
  
  return 'Restaurant';
}