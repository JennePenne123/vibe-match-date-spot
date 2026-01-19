import { calculateVenueAIScore, calculateConfidenceLevel } from './scoring';
import { getActiveVenues, getStoredAIScore } from './fetching';
import { filterVenuesByPreferences, filterVenuesByCollaborativePreferences } from './preferenceFiltering';
import { calculateDistanceFromHamburg } from './helperFunctions';
import { supabase } from '@/integrations/supabase/client';
import { validateLocation } from '@/utils/locationValidation';
import { calculateStringSimilarity, calculateGeoDistance } from '@/utils/stringUtils';
import { API_CONFIG } from '@/config/apiConfig';
import { venueCacheService } from '@/services/venueCacheService';
import { apiUsageService } from '@/services/apiUsageService';

export interface AIVenueRecommendation {
  venue_id: string;
  venue_name: string;
  venue_address: string;
  venue_image?: string;
  venue_photos?: Array<{
    url: string;
    thumbnail?: string;
    width: number;
    height: number;
    attribution?: string;
    isGooglePhoto: boolean;
  }>;
  ai_score: number;
  match_factors: any;
  contextual_score: number;
  ai_reasoning: string;
  confidence_level: number;
  distance?: string;
  neighborhood?: string;
  isOpen?: boolean;
  operatingHours?: string[];
  priceRange?: string;
  rating?: number;
  cuisine_type?: string;
  amenities?: string[];
}

export const getAIVenueRecommendations = async (
  userId: string,
  partnerId?: string,
  limit: number = 10,
  userLocation?: { latitude: number; longitude: number; address?: string }
): Promise<AIVenueRecommendation[]> => {
  try {
    // Get venues using hybrid multi-source strategy
    let venues = [];
    if (userLocation?.latitude && userLocation?.longitude) {
      venues = await getVenuesFromMultipleSources(userId, limit * 2, userLocation);
    }
    
    // Fallback to database venues if all sources fail or no location
    if (!venues || venues.length === 0) {
      venues = await getActiveVenues(100);
    }

    if (!venues || venues.length === 0) {
      throw new Error('No venues in database. Please use the debug tools to create test venues first.');
    }

    // Filter venues by preferences
    if (partnerId) {
      venues = await filterVenuesByCollaborativePreferences(userId, partnerId, venues);
    } else {
      venues = await filterVenuesByPreferences(userId, venues);
    }

    const recommendations: AIVenueRecommendation[] = [];

    // Calculate AI scores for each venue
    for (const venue of venues) {
      // Ensure venue has a valid ID
      if (!venue.id) {
        venue.id = `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      const aiScore = await calculateVenueAIScore(venue.id, userId, partnerId);
      const scoreData = await getStoredAIScore(venue.id, userId);

      // Extract clean venue ID with priority order
      const cleanVenueId = extractVenueId(venue);
      
      if (!cleanVenueId) {
        continue; // Skip venues without valid IDs
      }

      const recommendation: AIVenueRecommendation = {
        venue_id: cleanVenueId,
        venue_name: venue.name,
        venue_address: venue.address || venue.location || venue.vicinity || 'Address not available',
        venue_image: venue.image_url || venue.image,
        venue_photos: venue.photos || [],
        ai_score: aiScore,
        match_factors: scoreData?.match_factors || {},
        contextual_score: scoreData?.contextual_score || 0,
        ai_reasoning: generateAIReasoning(venue, scoreData?.match_factors, aiScore),
        confidence_level: calculateConfidenceLevel(aiScore, scoreData?.match_factors),
        distance: calculateDistanceFromHamburg(venue),
        neighborhood: extractNeighborhood(venue.address || venue.location || venue.vicinity),
        isOpen: determineOpenStatus(venue.opening_hours || venue.openNow),
        operatingHours: formatOperatingHours(venue.opening_hours),
        priceRange: venue.price_range || venue.priceRange,
        rating: venue.rating,
        cuisine_type: venue.cuisine_type || venue.cuisineType,
        amenities: venue.tags || []
      };

      if (typeof recommendation.venue_id === 'string' && recommendation.venue_id.trim()) {
        recommendations.push(recommendation);
      }
    }

    // Sort by AI score and validate
    const sortedRecommendations = recommendations
      .sort((a, b) => b.ai_score - a.ai_score)
      .slice(0, limit);

    return validateRecommendations(sortedRecommendations);
  } catch (error) {
    console.error('Failed to get venue recommendations:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get venue recommendations');
  }
};

/**
 * Extract a valid venue ID from venue object
 */
function extractVenueId(venue: any): string | null {
  if (venue.id && typeof venue.id === 'string' && venue.id.trim()) {
    return venue.id.trim();
  }
  if (venue.placeId && typeof venue.placeId === 'string' && venue.placeId.trim()) {
    return venue.placeId.trim();
  }
  if (venue.google_place_id && typeof venue.google_place_id === 'string' && venue.google_place_id.trim()) {
    return venue.google_place_id.trim();
  }
  if (venue.id && typeof venue.id === 'object' && venue.id.value) {
    return String(venue.id.value).trim();
  }
  if (venue.id) {
    const strId = String(venue.id).trim();
    if (strId && strId !== 'undefined' && strId !== 'null') {
      return strId;
    }
  }
  return null;
}

/**
 * Validate recommendations have valid IDs, generate emergency IDs if needed
 */
function validateRecommendations(recommendations: AIVenueRecommendation[]): AIVenueRecommendation[] {
  return recommendations.filter(rec => {
    if (!rec.venue_id || typeof rec.venue_id !== 'string' || !rec.venue_id.trim()) {
      rec.venue_id = `emergency_${rec.venue_name?.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    }
    return rec.venue_id && typeof rec.venue_id === 'string' && rec.venue_id.trim().length > 0;
  });
}

/**
 * Hybrid multi-source venue search
 */
const getVenuesFromMultipleSources = async (
  userId: string,
  limit: number,
  userLocation?: { latitude: number; longitude: number; address?: string }
) => {
  // Check cache first if we have location
  if (userLocation?.latitude && userLocation?.longitude) {
    const cachedVenues = venueCacheService.getCachedSearch(
      userLocation.latitude,
      userLocation.longitude
    );
    if (cachedVenues && cachedVenues.length > 0) {
      console.log('[VenueSearch] 🎯 Using cached venues:', cachedVenues.length);
      
      // Log cache hit as a "free" API call
      await apiUsageService.logApiCall({
        api_name: 'venue_cache',
        endpoint: '/cached-search',
        user_id: userId,
        response_status: 200,
        cache_hit: true,
        estimated_cost: 0,
        request_metadata: { 
          venueCount: cachedVenues.length,
          location: `${userLocation.latitude.toFixed(4)},${userLocation.longitude.toFixed(4)}`
        }
      });
      
      return cachedVenues;
    }
  }

  const strategy = API_CONFIG.venueSearchStrategy;
  let venues: any[] = [];
  
  if (strategy === 'google-first') {
    venues = await getVenuesGoogleFirst(userId, limit, userLocation);
  } else if (strategy === 'foursquare-first') {
    venues = await getVenuesFoursquareFirst(userId, limit, userLocation);
  } else {
    venues = await getVenuesParallel(userId, limit, userLocation);
  }
  
  // Store in cache after fetching
  if (venues.length > 0 && userLocation?.latitude && userLocation?.longitude) {
    venueCacheService.setCachedSearch(
      userLocation.latitude,
      userLocation.longitude,
      venues
    );
  }
  
  return venues;
};

/**
 * Parallel strategy: Call both APIs simultaneously
 */
const getVenuesParallel = async (
  userId: string,
  limit: number,
  userLocation?: { latitude: number; longitude: number; address?: string }
) => {
  const promises: Promise<any[]>[] = [];
  
  if (API_CONFIG.useGooglePlaces) {
    promises.push(getVenuesFromGooglePlaces(userId, limit, userLocation).catch(() => []));
  }
  
  if (API_CONFIG.useFoursquare && userLocation) {
    promises.push(getVenuesFromFoursquare(userId, limit, userLocation).catch(() => []));
  }
  
  const results = await Promise.all(promises);
  const [googleVenues = [], foursquareVenues = []] = results;
  
  return mergeAndDeduplicateVenues(googleVenues, foursquareVenues);
};

/**
 * Google-first strategy
 */
const getVenuesGoogleFirst = async (
  userId: string,
  limit: number,
  userLocation?: { latitude: number; longitude: number; address?: string }
) => {
  let venues: any[] = [];
  
  if (API_CONFIG.useGooglePlaces) {
    venues = await getVenuesFromGooglePlaces(userId, limit, userLocation).catch(() => []);
  }
  
  if (venues.length >= API_CONFIG.minVenuesForSuccess) {
    return venues;
  }
  
  if (API_CONFIG.useFoursquare && userLocation) {
    const fsqVenues = await getVenuesFromFoursquare(userId, limit - venues.length, userLocation).catch(() => []);
    venues = mergeAndDeduplicateVenues(venues, fsqVenues);
  }
  
  return venues;
};

/**
 * Foursquare-first strategy
 */
const getVenuesFoursquareFirst = async (
  userId: string,
  limit: number,
  userLocation?: { latitude: number; longitude: number; address?: string }
) => {
  let venues: any[] = [];
  
  if (API_CONFIG.useFoursquare && userLocation) {
    venues = await getVenuesFromFoursquare(userId, limit, userLocation).catch(() => []);
  }
  
  if (venues.length >= API_CONFIG.minVenuesForSuccess) {
    return venues;
  }
  
  if (API_CONFIG.useGooglePlaces) {
    const googleVenues = await getVenuesFromGooglePlaces(userId, limit - venues.length, userLocation).catch(() => []);
    venues = mergeAndDeduplicateVenues(venues, googleVenues);
  }
  
  return venues;
};

/**
 * Merge and deduplicate venues from multiple sources
 */
function mergeAndDeduplicateVenues(googleVenues: any[], foursquareVenues: any[]): any[] {
  if (!API_CONFIG.mergeVenueData) {
    return [...googleVenues, ...foursquareVenues].slice(0, API_CONFIG.maxTotalVenues);
  }
  
  const merged: any[] = [...googleVenues];
  const addedIds = new Set(googleVenues.map(v => v.id || v.venue_id));
  
  for (const fsqVenue of foursquareVenues) {
    const matchingVenue = googleVenues.find(gv => areVenuesDuplicates(gv, fsqVenue));
    
    if (matchingVenue) {
      enrichVenueWithFoursquare(matchingVenue, fsqVenue);
    } else {
      const venueId = fsqVenue.id || fsqVenue.venue_id;
      if (!addedIds.has(venueId)) {
        merged.push(fsqVenue);
        addedIds.add(venueId);
      }
    }
  }
  
  return merged.slice(0, API_CONFIG.maxTotalVenues);
}

/**
 * Check if two venues are duplicates
 */
function areVenuesDuplicates(v1: any, v2: any): boolean {
  const name1 = (v1.name || '').toLowerCase().trim();
  const name2 = (v2.name || '').toLowerCase().trim();
  
  if (name1 === name2) return true;
  
  if (v1.latitude && v1.longitude && v2.latitude && v2.longitude) {
    const distance = calculateGeoDistance(v1.latitude, v1.longitude, v2.latitude, v2.longitude);
    if (distance < API_CONFIG.deduplicationThreshold) {
      const similarity = calculateStringSimilarity(name1, name2);
      if (similarity > API_CONFIG.nameSimilarityThreshold) return true;
    }
  }
  
  return false;
}

/**
 * Enrich Google venue with Foursquare data
 */
function enrichVenueWithFoursquare(googleVenue: any, fsqVenue: any): void {
  if (fsqVenue.foursquare_id) googleVenue.foursquare_id = fsqVenue.foursquare_id;
  
  if (fsqVenue.photos?.length > 0) {
    googleVenue.photos = googleVenue.photos || [];
    const existingUrls = new Set(googleVenue.photos.map((p: any) => p.url));
    for (const photo of fsqVenue.photos) {
      if (!existingUrls.has(photo.url)) googleVenue.photos.push(photo);
    }
  }
  
  if (fsqVenue.foursquare_data) {
    googleVenue.foursquare_data = { ...googleVenue.foursquare_data, ...fsqVenue.foursquare_data };
  }
  
  if (!googleVenue.description && fsqVenue.description) {
    googleVenue.description = fsqVenue.description;
  }
}

/**
 * Fetch venues from Foursquare
 */
const getVenuesFromFoursquare = async (
  userId: string,
  limit: number,
  userLocation?: { latitude: number; longitude: number; address?: string }
) => {
  const timer = apiUsageService.createTimer('foursquare', '/search-venues-foursquare');
  
  try {
    if (!userLocation?.latitude || !userLocation?.longitude) {
      return [];
    }
    
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!userPrefs) {
      await timer.end({ status: 400, cacheHit: false, userId, metadata: { error: 'No user preferences' } });
      return [];
    }
    
    const { data, error } = await supabase.functions.invoke('search-venues-foursquare', {
      body: {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        cuisines: userPrefs.preferred_cuisines || [],
        radius: (userPrefs.max_distance || 10) * 1000,
        limit
      }
    });
    
    if (error) {
      await timer.end({ 
        status: 500, 
        cacheHit: false, 
        userId,
        metadata: { error: error.message }
      });
      return [];
    }
    
    const venues = data?.venues || [];
    await timer.end({ 
      status: 200, 
      cacheHit: false, 
      userId,
      metadata: { 
        venueCount: venues.length,
        location: `${userLocation.latitude.toFixed(4)},${userLocation.longitude.toFixed(4)}`
      }
    });
    
    return venues;
  } catch (err) {
    await timer.end({ 
      status: 500, 
      cacheHit: false, 
      userId,
      metadata: { error: err instanceof Error ? err.message : 'Unknown error' }
    });
    return [];
  }
};

/**
 * Fetch venues from Google Places
 */
const getVenuesFromGooglePlaces = async (
  userId: string, 
  limit: number, 
  userLocation?: { latitude: number; longitude: number; address?: string }
) => {
  const timer = apiUsageService.createTimer('google_places', '/search-venues');
  
  try {
    if (!userId || !userLocation?.latitude || !userLocation?.longitude) {
      throw new Error('User ID and valid location are required');
    }
    
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefsError || !userPrefs) {
      await timer.end({ status: 400, cacheHit: false, userId, metadata: { error: 'Preferences not found' } });
      throw new Error('User preferences not found. Please set your preferences first.');
    }

    const fixedPrefs = {
      preferred_cuisines: userPrefs.preferred_cuisines || [],
      preferred_vibes: userPrefs.preferred_vibes || [],
      max_distance: userPrefs.max_distance || 10
    };

    const locationValidation = validateLocation(userLocation);
    if (!locationValidation.isValid) {
      await timer.end({ status: 400, cacheHit: false, userId, metadata: { error: 'Invalid location' } });
      throw new Error(locationValidation.error || 'Invalid user location');
    }

    const { latitude, longitude } = userLocation;
    const location = userLocation.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    const requestPayload = {
      location,
      cuisines: fixedPrefs.preferred_cuisines,
      vibes: fixedPrefs.preferred_vibes,
      latitude,
      longitude,
      radius: fixedPrefs.max_distance * 1609
    };

    let searchResult = null;
    
    try {
      const result = await Promise.race([
        supabase.functions.invoke('search-venues', { body: requestPayload }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 20000))
      ]) as any;
      
      if (result?.error) throw new Error(result.error.message);
      searchResult = result?.data;
      
      // Log successful API call
      const venues = searchResult?.venues || [];
      await timer.end({ 
        status: 200, 
        cacheHit: false, 
        userId,
        metadata: { 
          venueCount: venues.length,
          location: `${latitude.toFixed(4)},${longitude.toFixed(4)}`
        }
      });
    } catch (edgeFnError) {
      // Edge function failed, log the failure
      await timer.end({ 
        status: 500, 
        cacheHit: false, 
        userId,
        metadata: { error: edgeFnError instanceof Error ? edgeFnError.message : 'Edge function failed' }
      });
      // Try database fallback
    }
    
    if (!searchResult) {
      const locationFilteredVenues = await getLocationFilteredDatabaseVenues(
        latitude, longitude, fixedPrefs.max_distance, fixedPrefs.preferred_cuisines
      );
      if (locationFilteredVenues.length > 0) return locationFilteredVenues;
      throw new Error('No venues found');
    }

    const venues = searchResult?.venues || [];
    if (venues.length === 0) {
      const locationFilteredVenues = await getLocationFilteredDatabaseVenues(
        latitude, longitude, fixedPrefs.max_distance, fixedPrefs.preferred_cuisines
      );
      return locationFilteredVenues;
    }

    return await transformAndSaveVenues(venues.slice(0, limit));
  } catch (error) {
    throw error;
  }
};

/**
 * Transform and save Google Places venues to database
 */
async function transformAndSaveVenues(venues: any[]): Promise<any[]> {
  const transformedVenues = [];
  
  for (const venue of venues) {
    try {
      const { data: existingVenue } = await supabase
        .from('venues')
        .select('id')
        .eq('google_place_id', venue.placeId)
        .maybeSingle();

      let venueId = existingVenue?.id;
      
      if (!existingVenue && venue.placeId) {
        const { data: newVenue, error: insertError } = await supabase
          .from('venues')
          .insert({
            name: venue.name,
            address: venue.location,
            cuisine_type: venue.cuisineType,
            price_range: venue.priceRange,
            rating: venue.rating,
            image_url: venue.image,
            photos: venue.photos || [],
            google_place_id: venue.placeId,
            phone: venue.phone,
            website: venue.website,
            tags: venue.tags || [],
            latitude: venue.latitude,
            longitude: venue.longitude,
            description: venue.description,
            source: 'google_places'  // Mark as trusted source for RLS policy
          })
          .select('id')
          .single();

        if (!insertError && newVenue) venueId = newVenue.id;
      }

      const finalVenueId = venue.placeId || venueId || `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      transformedVenues.push({
        id: finalVenueId,
        name: venue.name,
        address: venue.location,
        location: venue.location,
        vicinity: venue.location,
        cuisine_type: venue.cuisineType,
        cuisineType: venue.cuisineType,
        price_range: venue.priceRange,
        priceRange: venue.priceRange,
        rating: venue.rating,
        image_url: venue.image,
        image: venue.image,
        photos: venue.photos || [],
        tags: venue.tags || [],
        latitude: venue.latitude,
        longitude: venue.longitude,
        openNow: venue.openNow,
        opening_hours: venue.openNow ? ['Open now'] : ['Hours not available']
      });
    } catch {
      // Skip venues that fail to process
    }
  }

  return transformedVenues;
}

export const generateAIReasoning = (venue: any, matchFactors: any, aiScore: number): string => {
  const reasons = [];
  
  if (matchFactors?.cuisine_match) {
    reasons.push(`Perfect cuisine match with ${venue.cuisine_type}`);
  }
  if (matchFactors?.price_match) {
    reasons.push(`Fits your budget preference (${venue.price_range})`);
  }
  if (matchFactors?.vibe_matches?.length > 0) {
    reasons.push(`Matches your preferred vibes: ${matchFactors.vibe_matches.join(', ')}`);
  }
  if (venue.rating >= 4.0) {
    reasons.push(`Highly rated venue (${venue.rating}★)`);
  }
  
  if (reasons.length === 0) {
    return `Good overall match based on your preferences (${Math.round(aiScore)}% match)`;
  }
  
  return reasons.join('. ') + '.';
};

const extractNeighborhood = (address: string): string | undefined => {
  if (!address) return undefined;
  const parts = address.split(',').map(part => part.trim());
  return parts.length > 1 ? parts[1] : undefined;
};

const determineOpenStatus = (openingHours: any): boolean => {
  if (typeof openingHours === 'boolean') return openingHours;
  if (!openingHours || !Array.isArray(openingHours)) return true;
  
  const now = new Date();
  const currentTime = now.getHours() * 100 + now.getMinutes();
  return currentTime >= 900 && currentTime <= 2200;
};

const formatOperatingHours = (openingHours: any): string[] => {
  if (!openingHours) return ['Hours not available'];
  if (Array.isArray(openingHours)) return openingHours;
  return ['Mon-Sun: 9:00 AM - 10:00 PM'];
};

/**
 * Get location-filtered database venues
 */
const getLocationFilteredDatabaseVenues = async (
  latitude: number, 
  longitude: number, 
  maxDistance: number, 
  preferredCuisines: string[]
) => {
  const { data: dbVenues, error: dbError } = await supabase
    .from('venues')
    .select('*')
    .eq('is_active', true);
  
  if (!dbError && dbVenues?.length > 0) {
    const filteredVenues = dbVenues.filter(venue => {
      if (!venue.latitude || !venue.longitude) return false;
      const distance = calculateGeoDistance(latitude, longitude, venue.latitude, venue.longitude);
      const withinDistance = distance <= maxDistance;
      const matchesCuisine = !preferredCuisines.length || preferredCuisines.some(cuisine => 
        venue.cuisine_type?.toLowerCase().includes(cuisine.toLowerCase())
      );
      return withinDistance && matchesCuisine;
    });
    
    if (filteredVenues.length > 0) {
      return filteredVenues.map(venue => ({
        id: venue.id,
        name: venue.name,
        address: venue.address,
        cuisine_type: venue.cuisine_type,
        price_range: venue.price_range || '$$',
        rating: venue.rating || 4.2,
        image_url: venue.image_url || 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
        tags: venue.tags || ['Restaurant'],
        phone: venue.phone,
        website: venue.website,
        description: venue.description
      }));
    }
  }
  
  // Hamburg test data fallback
  const isHamburgArea = calculateGeoDistance(latitude, longitude, 53.57, 9.96) < 50;
  
  if (isHamburgArea && preferredCuisines.includes('Italian')) {
    return await createHamburgTestVenues();
  }
  
  return [];
};

/**
 * Create Hamburg test venues for development
 */
async function createHamburgTestVenues(): Promise<any[]> {
  const testVenues = [
    { name: "Ristorante Da Capo", address: "Eppendorfer Weg 15, 20259 Hamburg, Germany", cuisine_type: "Italian", price_range: "$$", rating: 4.5, latitude: 53.574, longitude: 9.966, tags: ["Italian", "romantic", "dinner"] },
    { name: "La Famiglia Hamburg", address: "Grindelallee 85, 20146 Hamburg, Germany", cuisine_type: "Italian", price_range: "$$", rating: 4.3, latitude: 53.567, longitude: 9.963, tags: ["Italian", "casual", "lunch"] },
    { name: "Il Buco", address: "Juliusstraße 16, 22769 Hamburg, Germany", cuisine_type: "Italian", price_range: "$$", rating: 4.4, latitude: 53.556, longitude: 9.954, tags: ["Italian", "romantic", "wine"] }
  ];
  
  const results = [];
  for (const testVenue of testVenues) {
    try {
      const { data: existing } = await supabase.from('venues').select('*').eq('name', testVenue.name).maybeSingle();
      
      if (!existing) {
        const { data: newVenue } = await supabase
          .from('venues')
          .insert({ ...testVenue, image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop' })
          .select('*')
          .single();
        if (newVenue) results.push(formatVenueResult(newVenue));
      } else {
        results.push(formatVenueResult(existing));
      }
    } catch {
      // Skip failed venues
    }
  }
  
  return results;
}

function formatVenueResult(venue: any) {
  return {
    id: venue.id,
    name: venue.name,
    address: venue.address,
    cuisine_type: venue.cuisine_type,
    price_range: venue.price_range,
    rating: venue.rating,
    image_url: venue.image_url,
    tags: venue.tags,
    phone: venue.phone,
    website: venue.website,
    description: venue.description
  };
}
