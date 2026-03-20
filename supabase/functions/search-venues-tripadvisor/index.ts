import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { checkRateLimitWithLogging, getRateLimitIdentifier, rateLimitResponse, RATE_LIMITS } from '../_shared/rate-limiter.ts';

const TRIPADVISOR_BASE_URL = 'https://api.content.tripadvisor.com/api/v1';

interface TripAdvisorLocation {
  location_id: string;
  name: string;
  distance: string;
  address_obj?: {
    street1?: string;
    city?: string;
    country?: string;
  };
}

interface TripAdvisorReview {
  id: string;
  lang: string;
  location_id: string;
  published_date: string;
  rating: number;
  title: string;
  text: string;
  user?: {
    username: string;
    avatar?: { small?: { url: string } };
  };
  subratings?: Record<string, { name: string; rating_image_url: string; value: string }>;
}

serve(async (req) => {
  console.log('🏨 TRIPADVISOR: ===== FUNCTION START =====');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = await checkRateLimitWithLogging(identifier, 'search-venues-tripadvisor', RATE_LIMITS.EXTERNAL_API, req);
  if (!rateLimitResult.allowed) {
    console.log(`🚫 TRIPADVISOR: Rate limit ${rateLimitResult.count}/${rateLimitResult.limit}`);
    return rateLimitResponse(corsHeaders);
  }

  try {
    const apiKey = Deno.env.get('TRIPADVISOR_API_KEY');
    if (!apiKey) {
      console.error('❌ TRIPADVISOR: API key not configured');
      return Response.json({
        success: false,
        error: 'TripAdvisor API key not configured',
        reviews: [],
      }, { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { mode, venueName, latitude, longitude, locationId } = body;

    // Mode 1: Search for a location by name + coordinates to get location_id
    if (mode === 'search') {
      if (!venueName || !latitude || !longitude) {
        return Response.json({
          success: false,
          error: 'venueName, latitude, and longitude required for search mode',
        }, { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const searchResult = await searchLocation(apiKey, venueName, latitude, longitude);
      console.log('🔍 TRIPADVISOR: Search result:', searchResult ? searchResult.location_id : 'not found');

      return Response.json({
        success: true,
        location: searchResult,
      }, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Mode 2: Fetch reviews for a known location_id
    if (mode === 'reviews') {
      if (!locationId) {
        return Response.json({
          success: false,
          error: 'locationId required for reviews mode',
        }, { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const reviews = await fetchReviews(apiKey, locationId);
      console.log('⭐ TRIPADVISOR: Fetched', reviews.length, 'reviews for location', locationId);

      return Response.json({
        success: true,
        locationId,
        reviews,
      }, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Mode 3: Combined — search + reviews in one call
    if (mode === 'enrich') {
      if (!venueName || !latitude || !longitude) {
        return Response.json({
          success: false,
          error: 'venueName, latitude, and longitude required for enrich mode',
        }, { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const location = await searchLocation(apiKey, venueName, latitude, longitude);
      if (!location) {
        console.log('⚠️ TRIPADVISOR: No matching location found for', venueName);
        return Response.json({
          success: true,
          location: null,
          reviews: [],
        }, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const reviews = await fetchReviews(apiKey, location.location_id);
      console.log('✅ TRIPADVISOR: Enriched', venueName, 'with', reviews.length, 'reviews');

      return Response.json({
        success: true,
        location,
        reviews,
      }, { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return Response.json({
      success: false,
      error: 'Invalid mode. Use "search", "reviews", or "enrich".',
    }, { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ TRIPADVISOR: Error:', msg);
    return Response.json({
      success: false,
      error: 'Internal server error',
      details: msg,
      reviews: [],
    }, { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

async function searchLocation(
  apiKey: string,
  query: string,
  lat: number,
  lng: number
): Promise<TripAdvisorLocation | null> {
  const params = new URLSearchParams({
    key: apiKey,
    searchQuery: query,
    latLong: `${lat},${lng}`,
    language: 'de',
    category: 'restaurants',
  });

  const url = `${TRIPADVISOR_BASE_URL}/location/search?${params}`;
  console.log('🔍 TRIPADVISOR: Searching for:', query);

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    console.error('❌ TRIPADVISOR: Search failed:', response.status, await response.text());
    return null;
  }

  const data = await response.json();
  const locations: TripAdvisorLocation[] = data.data || [];

  // Return first match (closest + most relevant)
  return locations.length > 0 ? locations[0] : null;
}

async function fetchReviews(
  apiKey: string,
  locationId: string
): Promise<TripAdvisorReview[]> {
  const params = new URLSearchParams({
    key: apiKey,
    language: 'de',
  });

  const url = `${TRIPADVISOR_BASE_URL}/location/${locationId}/reviews?${params}`;
  console.log('⭐ TRIPADVISOR: Fetching reviews for location:', locationId);

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    console.error('❌ TRIPADVISOR: Reviews failed:', response.status, await response.text());
    return [];
  }

  const data = await response.json();
  const reviews: TripAdvisorReview[] = data.data || [];

  // Map to a clean format
  return reviews.slice(0, 5).map((r) => ({
    id: r.id,
    lang: r.lang,
    location_id: r.location_id,
    published_date: r.published_date,
    rating: r.rating,
    title: r.title,
    text: r.text,
    user: r.user
      ? {
          username: r.user.username,
          avatar: r.user.avatar?.small?.url || null,
        }
      : null,
    subratings: r.subratings || null,
  })) as any;
}
