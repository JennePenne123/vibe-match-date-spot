import { calculateVenueAIScore, calculateConfidenceLevel } from './scoring';
import { getActiveVenues, getStoredAIScore } from './fetching';
import { filterVenuesByPreferences, filterVenuesByCollaborativePreferences, AREA_VIBE_MAP } from './preferenceFiltering';
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
  latitude?: number;
  longitude?: number;
}

export const getAIVenueRecommendations = async (
  userId: string,
  partnerId?: string,
  limit: number = 10,
  userLocation?: { latitude: number; longitude: number; address?: string },
  selectedArea?: string
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

    // Filter venues by preferences (now includes area-based scoring)
    if (partnerId) {
      venues = await filterVenuesByCollaborativePreferences(userId, partnerId, venues);
    } else {
      venues = await filterVenuesByPreferences(userId, venues, selectedArea);
    }

    const recommendations: AIVenueRecommendation[] = [];

    // Fetch user preferences once (avoid N+1 queries)
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Build recommendations using the preferenceScore from filtering + local scoring
    for (const venue of venues) {
      if (!venue.id) {
        venue.id = `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

      const cleanVenueId = extractVenueId(venue);
      if (!cleanVenueId) continue;

      // Use the preferenceScore from filtering as the primary score (0-100)
      // This already accounts for cuisine, price, vibe, and rating matching
      const prefScore = venue.preferenceScore || venue.collaborativeScore || 50;
      
      // Apply contextual bonuses
      let contextBonus = 0;
      const hour = new Date().getHours();
      if (hour >= 18 && hour <= 21) contextBonus += 5; // Dinner
      else if (hour >= 11 && hour <= 14) contextBonus += 3; // Lunch

      // Rating bonus
      const ratingBonus = venue.rating ? Math.min((venue.rating - 3.0) * 3, 10) : 0;

      // Compute final score: preference-driven with small contextual adjustments
      const finalScore = Math.max(15, Math.min(98, prefScore + contextBonus + ratingBonus));

      // Generate reasoning based on actual matches
      const matchReasons: string[] = [];
      if (userPrefs?.preferred_cuisines?.some((c: string) => 
        venue.cuisine_type?.toLowerCase().includes(c.toLowerCase()) ||
        c.toLowerCase().includes(venue.cuisine_type?.toLowerCase() || '')
      )) {
        matchReasons.push(`Passt zu deiner Lieblingsküche: ${venue.cuisine_type}`);
      }
      if (userPrefs?.preferred_price_range?.includes(venue.price_range)) {
        matchReasons.push(`Preisklasse ${venue.price_range} passt`);
      }
      if (venue.rating && venue.rating >= 4.0) {
        matchReasons.push(`Top bewertet (${venue.rating}⭐)`);
      }
      // New category matches
      const venueTags = (venue.tags || []).map((t: string) => t.toLowerCase()).join(' ');
      const venueText = [venueTags, (venue.name || '').toLowerCase(), (venue.description || '').toLowerCase()].join(' ');
      if ((userPrefs as any)?.preferred_venue_types?.some((vt: string) => venueText.includes(vt.replace('_', ' ')))) {
        matchReasons.push('Passt zu deinen Erlebnis-Präferenzen');
      }
      if ((userPrefs as any)?.preferred_activities?.some((act: string) => venueText.includes(act.replace('_', ' ')))) {
        matchReasons.push('Passt zu deinen Aktivitäten');
      }
      // Area vibe match reasoning
      if (selectedArea && AREA_VIBE_MAP[selectedArea]) {
        const areaConfig = AREA_VIBE_MAP[selectedArea];
        const areaNames: Record<string, string> = {
          'downtown': 'Downtown', 'waterfront': 'Waterfront', 'arts-district': 'Arts District',
          'oldtown': 'Old Town', 'uptown': 'Uptown'
        };
        if (areaConfig.keywords.some(kw => venueText.includes(kw)) || areaConfig.vibes.some(v => venueText.includes(v))) {
          matchReasons.push(`Passt zum ${areaNames[selectedArea] || selectedArea}-Vibe`);
        }
      }
      if (matchReasons.length === 0) {
        matchReasons.push('Entdecke etwas Neues in deiner Nähe');
      }

      // Extract best image from photos array or image_url
      const photosArray = Array.isArray(venue.photos) ? venue.photos : [];
      const firstPhotoUrl = photosArray.length > 0 
        ? (typeof photosArray[0] === 'string' ? photosArray[0] : photosArray[0]?.url)
        : undefined;
      const bestImage = venue.image_url || venue.image || firstPhotoUrl;

      const recommendation: AIVenueRecommendation = {
        venue_id: cleanVenueId,
        venue_name: venue.name,
        venue_address: venue.address || venue.location || venue.vicinity || 'Address not available',
        venue_image: bestImage,
        venue_photos: photosArray,
        ai_score: finalScore / 100,
        match_factors: {
          cuisine_match: !!userPrefs?.preferred_cuisines?.some((c: string) => 
            venue.cuisine_type?.toLowerCase().includes(c.toLowerCase())
          ),
          price_match: !!userPrefs?.preferred_price_range?.includes(venue.price_range),
          preference_score: prefScore,
        },
        contextual_score: contextBonus / 100,
        ai_reasoning: matchReasons.join(' • '),
        confidence_level: calculateConfidenceLevel(finalScore, {}),
        distance: calculateDistanceFromHamburg(venue),
        neighborhood: extractNeighborhood(venue.address || venue.location || venue.vicinity),
        isOpen: determineOpenStatus(venue.opening_hours || venue.openNow),
        operatingHours: formatOperatingHours(venue.opening_hours),
        priceRange: venue.price_range || venue.priceRange,
        rating: venue.rating,
        cuisine_type: venue.cuisine_type || venue.cuisineType,
        amenities: venue.tags || [],
        latitude: venue.latitude ?? venue.lat ?? venue.geometry?.location?.lat,
        longitude: venue.longitude ?? venue.lng ?? venue.geometry?.location?.lng
      };

      if (typeof recommendation.venue_id === 'string' && recommendation.venue_id.trim()) {
        recommendations.push(recommendation);
      }
    }

    // Sort by AI score, then apply diversity filter
    const sortedRecommendations = recommendations
      .sort((a, b) => b.ai_score - a.ai_score);

    // Quality gate: Top 3 must have ≥75% match score
    // Venues below threshold are demoted out of the top 3
    const MIN_TOP3_SCORE = 0.80;
    const qualifiedTop3 = sortedRecommendations.filter(r => r.ai_score >= MIN_TOP3_SCORE);
    const belowThreshold = sortedRecommendations.filter(r => r.ai_score < MIN_TOP3_SCORE);
    
    // Rebuild: qualified venues first (sorted by score), then the rest
    const qualitySorted = [...qualifiedTop3, ...belowThreshold];

    // Diversity: limit max 3 venues per cuisine_type to avoid monotony
    const diverseRecommendations: AIVenueRecommendation[] = [];
    const cuisineCount: Record<string, number> = {};
    const MAX_PER_CUISINE = 3;

    for (const rec of qualitySorted) {
      const cuisine = (rec.cuisine_type || 'Other').toLowerCase();
      cuisineCount[cuisine] = (cuisineCount[cuisine] || 0) + 1;
      if (cuisineCount[cuisine] <= MAX_PER_CUISINE) {
        diverseRecommendations.push(rec);
      }
      if (diverseRecommendations.length >= limit) break;
    }

    // If diversity filter removed too many, backfill from remaining
    if (diverseRecommendations.length < limit) {
      for (const rec of qualitySorted) {
        if (!diverseRecommendations.includes(rec)) {
          diverseRecommendations.push(rec);
        }
        if (diverseRecommendations.length >= limit) break;
      }
    }

    console.log(`🏆 TOP 3 QUALITY: ${qualifiedTop3.slice(0, 3).length}/3 venues meet ≥75% threshold`, 
      qualifiedTop3.slice(0, 3).map(r => `${r.venue_name}: ${Math.round(r.ai_score * 100)}%`));

    return validateRecommendations(diverseRecommendations);
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
  // Fetch user preferences for cache key differentiation
  const { data: userPrefs } = await supabase
    .from('user_preferences')
    .select('preferred_cuisines, preferred_vibes, preferred_price_range, preferred_activities, preferred_venue_types')
    .eq('user_id', userId)
    .single();

  const cacheCuisines = userPrefs?.preferred_cuisines || [];
  const cacheVibes = userPrefs?.preferred_vibes || [];
  const cachePriceRange = userPrefs?.preferred_price_range || [];

  // Check cache first if we have location — now includes preferences in key
  if (userLocation?.latitude && userLocation?.longitude) {
    const cachedVenues = venueCacheService.getCachedSearch(
      userLocation.latitude,
      userLocation.longitude,
      cacheCuisines,
      cachePriceRange,
      cacheVibes
    );
    if (cachedVenues && cachedVenues.length > 0) {
      console.log('[VenueSearch] 🎯 Using cached venues:', cachedVenues.length);
      
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
  
  if (strategy === 'radar-overpass') {
    venues = await getVenuesRadarOverpass(userId, limit, userLocation);
  } else if (strategy === 'overpass-only') {
    venues = await getVenuesOverpassOnly(userId, limit, userLocation);
  } else {
    venues = await getVenuesParallel(userId, limit, userLocation);
  }
  
  // Store in cache after fetching — now includes preferences in key
  if (venues.length > 0 && userLocation?.latitude && userLocation?.longitude) {
    venueCacheService.setCachedSearch(
      userLocation.latitude,
      userLocation.longitude,
      venues,
      cacheCuisines,
      cachePriceRange,
      cacheVibes
    );
  }
  
  return venues;
};

/**
 * Radar + Overpass strategy: Radar for primary search, Overpass/OSM for additional coverage (free)
 */
async function getVenuesRadarOverpass(
  userId: string,
  limit: number,
  userLocation?: { latitude: number; longitude: number; address?: string }
) {
  // Step 1: Get venues from Radar (primary, high free tier)
  let venues = await getVenuesFromRadar(userId, limit, userLocation).catch(() => []);
  
  // Step 2: Enrich with Overpass/OSM data (free, unlimited)
  if (API_CONFIG.useOverpass && userLocation) {
    const osmVenues = await getVenuesFromOverpass(userId, limit, userLocation).catch(() => []);
    venues = mergeAndDeduplicateVenues(venues, osmVenues);
  }
  
  // Step 3: If Radar returned nothing, fall back to Overpass-only
  if (venues.length < API_CONFIG.minVenuesForSuccess && API_CONFIG.useOverpass && userLocation) {
    console.log('⚠️ Radar returned few results, falling back to Overpass-only');
    const osmVenues = await getVenuesFromOverpass(userId, limit, userLocation).catch(() => []);
    venues = mergeAndDeduplicateVenues(venues, osmVenues);
  }

  // Step 4: Google Places fallback for niche venue types
  if (userLocation && API_CONFIG.useGooglePlaces) {
    const { data: userPrefs } = await supabase
      .from('user_preferences')
      .select('preferred_venue_types, preferred_activities')
      .eq('user_id', userId)
      .single();

    const nicheTypes = (userPrefs as any)?.preferred_venue_types || [];
    const nicheActivities = (userPrefs as any)?.preferred_activities || [];
    const hasNichePreferences = nicheTypes.length > 0 || nicheActivities.length > 0;

    const nicheKeywords = [...nicheTypes, ...nicheActivities].map((t: string) => t.replace(/_/g, ' ').toLowerCase());
    const nicheMatches = venues.filter((v: any) => {
      const text = [(v.name || ''), (v.description || ''), ...(v.tags || [])].join(' ').toLowerCase();
      return nicheKeywords.some(kw => text.includes(kw));
    });

    if (hasNichePreferences && nicheMatches.length < 3) {
      console.log('🔍 Google Places fallback: only', nicheMatches.length, 'niche matches, fetching from Google...');
      
      const googleTypesMap: Record<string, string> = {
        'museum': 'museum', 'gallery': 'art_gallery', 'theater_venue': 'movie_theater',
        'cinema': 'movie_theater', 'concert_hall': 'night_club', 'bowling': 'bowling_alley',
        'swimming': 'swimming_pool', 'spa_wellness': 'spa', 'arcade': 'amusement_park',
        'mini_golf': 'amusement_park', 'karaoke': 'night_club', 'comedy_club': 'night_club',
        'climbing': 'gym', 'escape_room': 'amusement_park',
      };

      const googleTypes = [...nicheTypes, ...nicheActivities]
        .map((t: string) => googleTypesMap[t])
        .filter(Boolean);

      if (googleTypes.length > 0) {
        try {
          const googleVenues = await getVenuesFromGooglePlaces(userId, 10, userLocation);
          if (googleVenues.length > 0) {
            console.log('✅ Google Places fallback found', googleVenues.length, 'additional venues');
            venues = mergeAndDeduplicateVenues(venues, googleVenues);
          }
        } catch (err) {
          console.warn('⚠️ Google Places fallback failed:', err instanceof Error ? err.message : 'Unknown error');
        }
      }
    }
  }
  
  return venues;
}

/**
 * Overpass-only strategy
 */
async function getVenuesOverpassOnly(
  userId: string,
  limit: number,
  userLocation?: { latitude: number; longitude: number; address?: string }
) {
  if (API_CONFIG.useOverpass && userLocation) {
    return await getVenuesFromOverpass(userId, limit, userLocation).catch(() => []);
  }
  return [];
}

/**
 * Parallel strategy: Call multiple APIs simultaneously
 */
async function getVenuesParallel(
  userId: string,
  limit: number,
  userLocation?: { latitude: number; longitude: number; address?: string }
) {
  const promises: Promise<any[]>[] = [];
  
  if (API_CONFIG.useRadar && userLocation) {
    promises.push(getVenuesFromRadar(userId, limit, userLocation).catch(() => []));
  }
  
  if (API_CONFIG.useOverpass && userLocation) {
    promises.push(getVenuesFromOverpass(userId, limit, userLocation).catch(() => []));
  }
  
  if (API_CONFIG.useGooglePlaces) {
    promises.push(getVenuesFromGooglePlaces(userId, limit, userLocation).catch(() => []));
  }
  
  const results = await Promise.all(promises);
  let merged: any[] = [];
  for (const result of results) {
    merged = mergeAndDeduplicateVenues(merged, result);
  }
  
  return merged;
}

/**
 * Merge and deduplicate venues from multiple sources
 */
function mergeAndDeduplicateVenues(primaryVenues: any[], secondaryVenues: any[]): any[] {
  if (!API_CONFIG.mergeVenueData) {
    return [...primaryVenues, ...secondaryVenues].slice(0, API_CONFIG.maxTotalVenues);
  }
  
  const merged: any[] = [...primaryVenues];
  const addedIds = new Set(primaryVenues.map(v => v.id || v.venue_id));
  
  for (const newVenue of secondaryVenues) {
    const matchingVenue = primaryVenues.find(pv => areVenuesDuplicates(pv, newVenue));
    
    if (matchingVenue) {
      enrichVenueWithSecondary(matchingVenue, newVenue);
    } else {
      const venueId = newVenue.id || newVenue.venue_id;
      if (!addedIds.has(venueId)) {
        merged.push(newVenue);
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
 * Enrich primary venue with secondary source data
 */
function enrichVenueWithSecondary(primaryVenue: any, secondaryVenue: any): void {
  if (secondaryVenue.photos?.length > 0) {
    primaryVenue.photos = primaryVenue.photos || [];
    const existingUrls = new Set(primaryVenue.photos.map((p: any) => p.url));
    for (const photo of secondaryVenue.photos) {
      if (!existingUrls.has(photo.url)) primaryVenue.photos.push(photo);
    }
  }
  
  if (!primaryVenue.description && secondaryVenue.description) {
    primaryVenue.description = secondaryVenue.description;
  }
  
  if (!primaryVenue.phone && secondaryVenue.phone) {
    primaryVenue.phone = secondaryVenue.phone;
  }
  
  if (!primaryVenue.website && secondaryVenue.website) {
    primaryVenue.website = secondaryVenue.website;
  }

  if (!primaryVenue.opening_hours && secondaryVenue.opening_hours) {
    primaryVenue.opening_hours = secondaryVenue.opening_hours;
  }
  
  // Merge tags
  if (secondaryVenue.tags?.length > 0) {
    primaryVenue.tags = [...new Set([...(primaryVenue.tags || []), ...secondaryVenue.tags])];
  }
}

/**
 * Fetch venues from Radar (primary search – 100K free calls/month)
 */
async function getVenuesFromRadar(
  userId: string,
  limit: number,
  userLocation?: { latitude: number; longitude: number; address?: string }
) {
  const timer = apiUsageService.createTimer('radar', '/search-venues-radar');
  
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
    
    const { data, error } = await supabase.functions.invoke('search-venues-radar', {
      body: {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        cuisines: userPrefs.preferred_cuisines || [],
        radius: (userPrefs.max_distance || 25) * 1000,
        limit,
        venueTypes: (userPrefs as any).preferred_venue_types || [],
        activities: (userPrefs as any).preferred_activities || [],
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
        chainsDetected: venues.filter((v: any) => v.is_chain).length,
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
}

/**
 * Fetch venues from Foursquare
 */
async function getVenuesFromFoursquare(
  userId: string,
  limit: number,
  userLocation?: { latitude: number; longitude: number; address?: string }
) {
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
        limit,
        venueTypes: (userPrefs as any).preferred_venue_types || [],
        activities: (userPrefs as any).preferred_activities || [],
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
}

/**
 * Fetch venues from Google Places
 */
async function getVenuesFromGooglePlaces(
  userId: string, 
  limit: number, 
  userLocation?: { latitude: number; longitude: number; address?: string }
) {
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
}

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
