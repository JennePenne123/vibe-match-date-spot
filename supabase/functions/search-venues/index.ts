
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  location: string;
  cuisines: string[];
  vibes: string[];
  latitude?: number;
  longitude?: number;
  radius?: number;
}

interface GooglePlace {
  id: string;
  displayName: { text: string };
  types: string[];
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  formattedAddress: string;
  photos?: Array<{
    name: string;
    widthPx: number;
    heightPx: number;
  }>;
  currentOpeningHours?: {
    openNow: boolean;
    weekdayDescriptions: string[];
  };
  nationalPhoneNumber?: string;
  websiteUri?: string;
  editorialSummary?: { text: string };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, cuisines, vibes, latitude, longitude, radius = 5000 }: SearchRequest = await req.json();
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

    if (!apiKey) {
      throw new Error('Google Places API key not configured');
    }

    if (!latitude || !longitude) {
      throw new Error('User location (latitude/longitude) is required');
    }

    console.log('Searching venues for:', { location, cuisines, vibes, latitude, longitude });

    // Map cuisines to Google Places types
    const cuisineTypeMap: Record<string, string[]> = {
      'italian': ['italian_restaurant'],
      'japanese': ['japanese_restaurant', 'sushi_restaurant'],
      'mexican': ['mexican_restaurant'],
      'french': ['french_restaurant'],
      'indian': ['indian_restaurant'],
      'mediterranean': ['mediterranean_restaurant', 'greek_restaurant'],
      'american': ['american_restaurant', 'hamburger_restaurant'],
      'thai': ['thai_restaurant'],
      'chinese': ['chinese_restaurant'],
      'korean': ['korean_restaurant']
    };

    // Map vibes to place types
    const vibeTypeMap: Record<string, string[]> = {
      'romantic': ['fine_dining_restaurant', 'wine_bar'],
      'casual': ['restaurant', 'cafe'],
      'outdoor': ['restaurant', 'bar'],
      'nightlife': ['bar', 'night_club', 'cocktail_lounge'],
      'cultural': ['restaurant', 'cafe'],
      'adventurous': ['restaurant', 'bar']
    };

    // Combine cuisine and vibe types
    const allTypes = new Set<string>();
    cuisines.forEach(cuisine => {
      const types = cuisineTypeMap[cuisine] || ['restaurant'];
      types.forEach(type => allTypes.add(type));
    });
    vibes.forEach(vibe => {
      const types = vibeTypeMap[vibe] || ['restaurant'];
      types.forEach(type => allTypes.add(type));
    });

    // If no specific types, default to restaurant
    if (allTypes.size === 0) {
      allTypes.add('restaurant');
    }

    // Search for places using the new Places API
    const searchUrl = 'https://places.googleapis.com/v1/places:searchNearby';
    const searchBody = {
      includedTypes: Array.from(allTypes).slice(0, 10), // Limit to avoid API limits
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { 
            latitude: latitude, 
            longitude: longitude 
          },
          radius: radius
        }
      }
    };

    console.log('Making request to Places API with:', searchBody);

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.types,places.rating,places.userRatingCount,places.priceLevel,places.location,places.formattedAddress,places.photos,places.currentOpeningHours,places.nationalPhoneNumber,places.websiteUri,places.editorialSummary'
      },
      body: JSON.stringify(searchBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Places API error: ${response.status} - ${errorText}`);
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Google Places API response:', JSON.stringify(data, null, 2));

    // Transform Google Places data to our venue format
    const venues = (data.places || []).map((place: GooglePlace, index: number) => {
      const cuisineType = getCuisineFromTypes(place.types, cuisines);
      const vibe = getVibeFromTypes(place.types, vibes);
      const matchScore = calculateMatchScore(place, cuisines, vibes);
      const distance = calculateDistance(latitude, longitude, place.location.latitude, place.location.longitude);
      
      return {
        id: place.id || `venue-${index}`,
        name: place.displayName?.text || 'Unknown Venue',
        description: place.editorialSummary?.text || `${cuisineType} restaurant with great atmosphere`,
        image: getPhotoUrl(place.photos?.[0], apiKey),
        rating: place.rating || 4.0,
        distance: `${distance.toFixed(1)} mi`,
        priceRange: mapPriceLevel(place.priceLevel),
        location: place.formattedAddress || location,
        cuisineType,
        vibe,
        matchScore,
        tags: getTagsFromPlace(place, cuisines, vibes),
        placeId: place.id,
        phone: place.nationalPhoneNumber,
        website: place.websiteUri,
        openingHours: place.currentOpeningHours?.weekdayDescriptions || [],
        isOpen: place.currentOpeningHours?.openNow
      };
    });

    // Sort by match score and distance
    venues.sort((a, b) => {
      const scoreA = b.matchScore - a.matchScore;
      if (Math.abs(scoreA) < 5) { // If scores are close, prefer closer venues
        return parseFloat(a.distance) - parseFloat(b.distance);
      }
      return scoreA;
    });

    console.log(`Returning ${venues.length} venues`);

    return new Response(JSON.stringify({ venues }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in search-venues function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

// Helper functions
function getCuisineFromTypes(types: string[], userCuisines: string[]): string {
  const typeMap: Record<string, string> = {
    'italian_restaurant': 'Italian',
    'japanese_restaurant': 'Japanese',
    'sushi_restaurant': 'Japanese',
    'mexican_restaurant': 'Mexican',
    'french_restaurant': 'French',
    'indian_restaurant': 'Indian',
    'mediterranean_restaurant': 'Mediterranean',
    'greek_restaurant': 'Mediterranean',
    'american_restaurant': 'American',
    'hamburger_restaurant': 'American',
    'thai_restaurant': 'Thai',
    'chinese_restaurant': 'Chinese',
    'korean_restaurant': 'Korean'
  };

  for (const type of types) {
    if (typeMap[type]) {
      return typeMap[type];
    }
  }

  return userCuisines[0] ? userCuisines[0].charAt(0).toUpperCase() + userCuisines[0].slice(1) : 'International';
}

function getVibeFromTypes(types: string[], userVibes: string[]): string {
  if (types.includes('fine_dining_restaurant') || types.includes('wine_bar')) return 'romantic';
  if (types.includes('bar') || types.includes('night_club')) return 'nightlife';
  if (types.includes('cafe')) return 'casual';
  
  return userVibes[0] || 'casual';
}

function calculateMatchScore(place: GooglePlace, cuisines: string[], vibes: string[]): number {
  let score = 60; // Base score
  
  // Rating boost
  if (place.rating) {
    score += (place.rating - 3) * 10; // 4.0 rating = +10, 5.0 rating = +20
  }
  
  // Review count boost
  if (place.userRatingCount && place.userRatingCount > 100) {
    score += 5;
  }
  
  // Type matching
  const cuisineMatch = getCuisineFromTypes(place.types, cuisines);
  if (cuisines.some(c => c.toLowerCase() === cuisineMatch.toLowerCase())) {
    score += 15;
  }
  
  return Math.min(score, 98); // Cap at 98%
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function mapPriceLevel(priceLevel?: string): string {
  switch (priceLevel) {
    case 'PRICE_LEVEL_INEXPENSIVE': return '$';
    case 'PRICE_LEVEL_MODERATE': return '$$';
    case 'PRICE_LEVEL_EXPENSIVE': return '$$$';
    case 'PRICE_LEVEL_VERY_EXPENSIVE': return '$$$$';
    default: return '$$';
  }
}

function getPhotoUrl(photo: any, apiKey: string): string {
  if (!photo) {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
  }
  
  return `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=400&maxHeightPx=300&key=${apiKey}`;
}

function getTagsFromPlace(place: GooglePlace, cuisines: string[], vibes: string[]): string[] {
  const tags: string[] = [];
  
  if (place.types.includes('fine_dining_restaurant')) tags.push('fine dining');
  if (place.types.includes('bar')) tags.push('bar');
  if (place.types.includes('wine_bar')) tags.push('wine');
  if (place.currentOpeningHours?.openNow) tags.push('open now');
  if (place.rating && place.rating >= 4.5) tags.push('highly rated');
  
  return tags;
}

serve(handler);
