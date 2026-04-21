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
      minRating = 3.0,
      fieldMask = 'essentials+pro' // 'essentials' | 'essentials+pro' | 'full'
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

    // 4. Build Google Places API (New) request — Nearby or Text Search
    const primaryType = validTypes[0] || 'restaurant';

    // Build cuisine/type keyword for text-based search
    const keywordParts: string[] = [];
    if (sanitizedCuisines && sanitizedCuisines.length > 0) {
      keywordParts.push(...sanitizedCuisines);
    }
    if (validTypes.length > 1) {
      keywordParts.push(...validTypes.slice(1).map((t: string) => t.replace(/_/g, ' ')));
    }
    const useTextSearch = keywordParts.length > 0;

    // Field mask cost optimization (New API uses comma-separated field paths)
    const photoLimit = fieldMask === 'essentials' ? 1 : fieldMask === 'full' ? 5 : 3;
    const includeOpeningHours = fieldMask !== 'essentials';
    const fieldMaskParts = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.shortFormattedAddress',
      'places.location',
      'places.rating',
      'places.priceLevel',
      'places.types',
      'places.photos',
    ];
    if (includeOpeningHours) fieldMaskParts.push('places.regularOpeningHours');
    const fieldMaskHeader = fieldMaskParts.join(',');

    let endpoint: string;
    let requestBody: Record<string, unknown>;

    if (useTextSearch) {
      // Text Search: best for cuisine/keyword queries
      endpoint = 'https://places.googleapis.com/v1/places:searchText';
      requestBody = {
        textQuery: `${keywordParts.join(' ')} ${primaryType}`.trim(),
        languageCode: 'de',
        maxResultCount: 20,
        locationBias: {
          circle: {
            center: { latitude: validLatitude, longitude: validLongitude },
            radius: validRadius,
          },
        },
      };
      console.log('🔍 SEARCH VENUES: Using Text Search with query:', requestBody.textQuery);
    } else {
      // Nearby Search: type-only filter
      endpoint = 'https://places.googleapis.com/v1/places:searchNearby';
      requestBody = {
        includedTypes: [primaryType],
        maxResultCount: 20,
        languageCode: 'de',
        locationRestriction: {
          circle: {
            center: { latitude: validLatitude, longitude: validLongitude },
            radius: validRadius,
          },
        },
      };
      console.log('🔍 SEARCH VENUES: Using Nearby Search for type:', primaryType);
    }

    // 5. Make Google Places API (New) Call
    console.log('📡 SEARCH VENUES: Making API request to', endpoint);
    const startTime = Date.now();

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMaskHeader,
        'User-Agent': 'HiOutz-App/1.0',
      },
      body: JSON.stringify(requestBody),
    });

    const requestDuration = Date.now() - startTime;
    console.log('⏱️ SEARCH VENUES: API request completed in:', requestDuration + 'ms');
    console.log('📡 SEARCH VENUES: Response status:', response.status, response.statusText);

    const placesData = await response.json();

    // 6. Handle Google Places API (New) Errors
    if (response.status === 403 || placesData?.error?.status === 'PERMISSION_DENIED') {
      console.error('❌ SEARCH VENUES: PERMISSION_DENIED:', placesData?.error?.message);
      return Response.json({
        success: false,
        error: 'Google Places API access denied',
        details: placesData?.error?.message || 'Check API key, billing & enabled APIs',
        venues: [],
      }, { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (response.status === 429 || placesData?.error?.status === 'RESOURCE_EXHAUSTED') {
      console.error('❌ SEARCH VENUES: RESOURCE_EXHAUSTED');
      return Response.json({
        success: false,
        error: 'Google Places API quota exceeded',
        details: placesData?.error?.message || 'Quota reached',
        venues: [],
      }, { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!response.ok) {
      console.error('❌ SEARCH VENUES: HTTP Error:', {
        status: response.status,
        statusText: response.statusText,
        body: placesData,
      });
      return Response.json({
        success: false,
        error: `Google Places API HTTP error: ${response.status}`,
        details: placesData?.error?.message || JSON.stringify(placesData),
        venues: [],
      }, { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('📊 SEARCH VENUES: Google Places API (New) Response:', {
      results_count: placesData.places?.length || 0,
    });

    // 7. Process Results — Places API (New) shape
    const venues = [];
    const places = placesData.places || [];

    if (places.length > 0) {
      console.log('🏢 SEARCH VENUES: Processing', places.length, 'venues...');

      // priceLevel in New API: PRICE_LEVEL_FREE / INEXPENSIVE / MODERATE / EXPENSIVE / VERY_EXPENSIVE
      const priceLevelMap: Record<string, number> = {
        PRICE_LEVEL_FREE: 0,
        PRICE_LEVEL_INEXPENSIVE: 1,
        PRICE_LEVEL_MODERATE: 2,
        PRICE_LEVEL_EXPENSIVE: 3,
        PRICE_LEVEL_VERY_EXPENSIVE: 4,
      };

      for (const place of places.slice(0, 20)) {
        try {
          const placeName: string = place.displayName?.text || 'Unknown';
          const formattedAddr: string = place.shortFormattedAddress || place.formattedAddress || '';
          const lat: number | undefined = place.location?.latitude;
          const lng: number | undefined = place.location?.longitude;
          const priceNum = priceLevelMap[place.priceLevel] ?? 2;

          // New API photo: photo.name = "places/{placeId}/photos/{photoId}"
          // URL: https://places.googleapis.com/v1/{photo.name}/media?maxWidthPx=...&key=...
          const buildPhotoUrl = (photoName: string, maxWidth: number) =>
            `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${apiKey}`;

          const placePhotos = (place.photos || []).slice(0, photoLimit).map((photo: any, index: number) => ({
            url: buildPhotoUrl(photo.name, index === 0 ? 800 : 400),
            thumbnail: buildPhotoUrl(photo.name, 200),
            width: photo.widthPx || 400,
            height: photo.heightPx || 300,
            attribution: cleanAttribution(photo.authorAttributions?.[0]?.displayName),
            isGooglePhoto: true,
          }));

          const venue = {
            placeId: place.id,
            name: placeName,
            location: formattedAddr,
            latitude: lat,
            longitude: lng,
            rating: place.rating || 4.0,
            priceRange: '€'.repeat(priceNum || 2),
            photos: placePhotos,
            image: place.photos?.[0]
              ? buildPhotoUrl(place.photos[0].name, 800)
              : 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
            cuisineType: determineCuisineType({ name: placeName, types: place.types }, sanitizedCuisines),
            tags: place.types || ['restaurant'],
            openNow: includeOpeningHours ? place.regularOpeningHours?.openNow : undefined,
            phone: null,
            website: null,
            description: `${placeName} in ${formattedAddr || 'der Nähe'}`,
          };

          venues.push(venue);

          if (venues.length <= 3) {
            console.log(`🏢 SEARCH VENUES: Venue ${venues.length}:`, {
              name: venue.name,
              location: venue.location,
              rating: venue.rating,
              cuisine: venue.cuisineType,
            });
          }
        } catch (venueError) {
          const errorMessage = venueError instanceof Error ? venueError.message : 'Unknown error';
          console.warn('⚠️ SEARCH VENUES: Error processing venue:', place.displayName?.text, errorMessage);
        }
      }
    }

    console.log('✅ SEARCH VENUES: Successfully processed', venues.length, 'venues');
    
    return Response.json({
      success: true,
      venues: venues,
        metadata: {
          total_found: places.length,
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