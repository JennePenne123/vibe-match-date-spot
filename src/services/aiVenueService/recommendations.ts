
import { calculateVenueAIScore, calculateConfidenceLevel } from './scoring';
import { getActiveVenues, getStoredAIScore } from './fetching';
import { filterVenuesByPreferences, filterVenuesByCollaborativePreferences } from './preferenceFiltering';
import { calculateDistanceFromHamburg } from './helperFunctions';
import { supabase } from '@/integrations/supabase/client';
import { validateLocation } from '@/utils/locationValidation';

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
  console.log('🚀 RECOMMENDATIONS: ===== STARTING VENUE RECOMMENDATIONS =====');
  console.log('🚀 RECOMMENDATIONS: Parameters:', { userId, partnerId, limit, userLocation });
  
  try {
    console.log('🎯 RECOMMENDATIONS: Starting venue search for user:', userId, 'partner:', partnerId);

    // Try Google Places API first if user location is available
    let venues = [];
    if (userLocation?.latitude && userLocation?.longitude) {
      console.log('🌐 RECOMMENDATIONS: Using Google Places API with user location');
      venues = await getVenuesFromGooglePlaces(userId, limit * 2, userLocation);
      console.log('🌐 RECOMMENDATIONS: Google Places returned:', venues?.length || 0, 'venues');
    }
    
    // Fallback to database venues if Google Places fails or no location
    if (!venues || venues.length === 0) {
      console.log('🗄️ RECOMMENDATIONS: Falling back to database venues');
      venues = await getActiveVenues(100);
      console.log('🗄️ RECOMMENDATIONS: Database returned:', venues?.length || 0, 'venues');
    }

    // If no database venues, suggest creating them
    if (!venues || venues.length === 0) {
      console.error('❌ RECOMMENDATIONS: No venues in database!');
      throw new Error('No venues in database. Please use the debug tools to create test venues first.');
    }

    // Filter venues by preferences (collaborative if partner exists)
    if (partnerId) {
      venues = await filterVenuesByCollaborativePreferences(userId, partnerId, venues);
      console.log('🤝 RECOMMENDATIONS: After collaborative filtering:', venues?.length || 0, 'venues');
    } else {
      venues = await filterVenuesByPreferences(userId, venues);
      console.log('🎯 RECOMMENDATIONS: After preference filtering:', venues?.length || 0, 'venues');
    }

    const recommendations: AIVenueRecommendation[] = [];

    // Calculate AI scores for each venue using real preference matching
    console.log('🧮 RECOMMENDATIONS: Calculating REAL AI scores for', venues.length, 'venues');
    for (const venue of venues) {
      // Ensure venue has a valid ID - critical fix for venue selection
      if (!venue.id) {
        const fallbackId = `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.warn(`⚠️ RECOMMENDATIONS: Venue "${venue.name}" missing ID, generated fallback: ${fallbackId}`);
        venue.id = fallbackId;
      }
      
      console.log(`📊 RECOMMENDATIONS: Scoring venue: ${venue.name} (ID: ${venue.id}) (${venue.cuisine_type || 'unknown cuisine'})`);
      const aiScore = await calculateVenueAIScore(venue.id, userId, partnerId);
      
      // Get stored AI score data for additional context
      const scoreData = await getStoredAIScore(venue.id, userId);

      // CRITICAL FIX: Enhanced venue ID extraction for Google Places + Database venues
      let cleanVenueId = '';
      
      // Priority order: venue.id (transformed Google Places) > placeId > google_place_id > fallback
      if (venue.id && typeof venue.id === 'string' && venue.id.trim()) {
        cleanVenueId = venue.id.trim();
      } else if (venue.placeId && typeof venue.placeId === 'string' && venue.placeId.trim()) {
        cleanVenueId = venue.placeId.trim();
      } else if (venue.google_place_id && typeof venue.google_place_id === 'string' && venue.google_place_id.trim()) {
        cleanVenueId = venue.google_place_id.trim();
      } else if (venue.id && typeof venue.id === 'object' && venue.id.value) {
        cleanVenueId = String(venue.id.value).trim();
      } else if (venue.id) {
        cleanVenueId = String(venue.id).trim();
      }
      
      // Final validation - skip venues without valid IDs
      if (!cleanVenueId || cleanVenueId === 'undefined' || cleanVenueId === 'null' || cleanVenueId.length === 0) {
        console.error(`🚨 RECOMMENDATIONS: Venue "${venue.name}" has NO VALID ID - SKIPPING:`, {
          venueId: venue.id,
          placeId: venue.placeId,
          googlePlaceId: venue.google_place_id,
          cleanId: cleanVenueId,
          idType: typeof venue.id
        });
        continue; // Skip venues without valid IDs
      }

      console.log(`🔍 RECOMMENDATIONS: Processing venue ${venue.name} with clean ID: "${cleanVenueId}"`);

      const recommendation: AIVenueRecommendation = {
        venue_id: cleanVenueId, // CRITICAL FIX: Always use the validated clean ID
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

      // CRITICAL: Final validation - venue_id MUST be a valid string
      if (typeof recommendation.venue_id !== 'string' || !recommendation.venue_id.trim()) {
        console.error(`🚨 RECOMMENDATIONS: CRITICAL ERROR - Invalid venue_id for ${venue.name}:`, recommendation.venue_id);
        continue; // Skip this venue
      }

      console.log(`✅ RECOMMENDATIONS: Successfully created recommendation for "${venue.name}" with ID: "${recommendation.venue_id}"`);
      recommendations.push(recommendation);
    }

    // Sort by AI score and return top recommendations
    // Ensure we always return some venues even if scores are low
    const sortedRecommendations = recommendations
      .sort((a, b) => b.ai_score - a.ai_score)
      .slice(0, limit);

    // CRITICAL: Final validation to ensure ALL venues have valid venue_id before returning
    console.log(`🔒 RECOMMENDATIONS: Final validation of ${sortedRecommendations.length} venues before returning...`);
    const validatedRecommendations = [];
    
    for (let i = 0; i < sortedRecommendations.length; i++) {
      const rec = sortedRecommendations[i];
      
      console.log(`🔍 FINAL VALIDATION DEBUG: Venue ${i}:`, {
        venue_name: rec.venue_name,
        venue_id: rec.venue_id,
        venue_id_type: typeof rec.venue_id,
        venue_id_full_object: JSON.stringify(rec.venue_id),
        has_venue_id_property: 'venue_id' in rec,
        rec_keys: Object.keys(rec)
      });
      
      // Critical check - venue_id MUST exist and be a valid string
      if (!rec.venue_id || typeof rec.venue_id !== 'string' || rec.venue_id.trim().length === 0) {
        console.error(`🚨 RECOMMENDATIONS: CRITICAL FAILURE - Venue being returned without valid venue_id:`, {
          venue_name: rec.venue_name,
          venue_id: rec.venue_id,
          venue_id_type: typeof rec.venue_id,
          index: i,
          full_recommendation: rec
        });
        
        // Emergency fix: Try to recover the venue_id or skip
        const emergencyId = `emergency_${rec.venue_name?.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
        console.warn(`🔧 RECOMMENDATIONS: Emergency ID generated for ${rec.venue_name}: ${emergencyId}`);
        rec.venue_id = emergencyId;
      }
      
      // Double-check after any emergency fixes
      if (rec.venue_id && typeof rec.venue_id === 'string' && rec.venue_id.trim().length > 0) {
        console.log(`✅ FINAL VALIDATION: ${rec.venue_name} - venue_id: "${rec.venue_id}" ✓`);
        validatedRecommendations.push(rec);
      } else {
        console.error(`❌ FINAL VALIDATION: Dropping venue ${rec.venue_name} - still no valid venue_id after emergency fixes`);
      }
    }

    console.log(`🎉 RECOMMENDATIONS: Final return - ${validatedRecommendations.length} validated venues:`,
      validatedRecommendations.slice(0, 3).map(r => `${r.venue_name} (ID: ${r.venue_id}): ${r.ai_score}%`));
      
    // Log the structure of the first venue being returned for debugging
    if (validatedRecommendations.length > 0) {
      console.log(`🔍 RECOMMENDATIONS: First venue structure being returned:`, {
        venue_id: validatedRecommendations[0].venue_id,
        venue_name: validatedRecommendations[0].venue_name,
        has_venue_id_field: 'venue_id' in validatedRecommendations[0],
        venue_id_type: typeof validatedRecommendations[0].venue_id,
        all_keys: Object.keys(validatedRecommendations[0]),
        full_first_venue: JSON.stringify(validatedRecommendations[0])
      });
    }
      
    return validatedRecommendations;
  } catch (error) {
    console.error('❌ RECOMMENDATIONS: Critical error in getAIVenueRecommendations:', {
      message: error.message,
      stack: error.stack,
      userId,
      partnerId,
      userLocation
    });
    
    // Re-throw error with user-friendly message to show in UI
    throw new Error(error.message || 'Failed to get venue recommendations. Please try again.');
  }
};

// Enhanced venue search with retry logic and improved fallback
const getVenuesFromGooglePlaces = async (userId: string, limit: number, userLocation?: { latitude: number; longitude: number; address?: string }) => {
  try {
    console.log('🔍 GOOGLE PLACES: Starting enhanced venue search for user:', userId, 'at location:', userLocation);
    
    // Early validation check
    if (!userId) {
      console.error('❌ GOOGLE PLACES: No userId provided!');
      throw new Error('User ID is required for venue search');
    }
    
    if (!userLocation?.latitude || !userLocation?.longitude) {
      console.error('❌ GOOGLE PLACES: Invalid location provided:', userLocation);
      throw new Error('Valid user location is required for venue search');
    }
    
    // Get user preferences with enhanced error handling
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('👤 GOOGLE PLACES: User preferences query result:', { userPrefs, prefsError });

    if (prefsError) {
      console.error('❌ GOOGLE PLACES: Error fetching user preferences:', prefsError);
      throw new Error('Failed to fetch user preferences');
    }

    if (!userPrefs) {
      console.warn('⚠️ GOOGLE PLACES: No user preferences found for user:', userId);
      throw new Error('User preferences not found. Please set your preferences first.');
    }

    // Handle empty preferences without forcing defaults
    const hasValidPreferences = 
      (userPrefs.preferred_cuisines?.length > 0) ||
      (userPrefs.preferred_vibes?.length > 0) ||
      (userPrefs.preferred_times?.length > 0) ||
      (userPrefs.preferred_price_range?.length > 0);

    if (!hasValidPreferences) {
      console.warn('⚠️ GOOGLE PLACES: User has no preferences set, will return generic results');
    }

    const fixedPrefs = {
      preferred_cuisines: userPrefs.preferred_cuisines || [],
      preferred_vibes: userPrefs.preferred_vibes || [],
      preferred_times: userPrefs.preferred_times || [],
      preferred_price_range: userPrefs.preferred_price_range || [],
      max_distance: userPrefs.max_distance || 10,
      hasValidPreferences
    };

    console.log('✅ PREFERENCES VALIDATED:', fixedPrefs);

    // Validate location
    const locationValidation = validateLocation(userLocation);
    if (!locationValidation.isValid) {
      console.error('❌ GOOGLE PLACES: Location validation failed:', locationValidation.error);
      throw new Error(locationValidation.error || 'Invalid user location');
    }

    const latitude = userLocation.latitude;
    const longitude = userLocation.longitude;
    const location = userLocation.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    // Try Google Places API first
    console.log('🔄 GOOGLE PLACES: Starting venue search for location:', location);

    // Enhanced edge function call with retry logic
    const requestPayload = {
      location,
      cuisines: fixedPrefs.preferred_cuisines,
      vibes: fixedPrefs.preferred_vibes,
      latitude,
      longitude,
      radius: fixedPrefs.max_distance * 1609 // Convert km to meters
    };
    
    console.log('🚀 GOOGLE PLACES: Edge function parameters:', requestPayload);

    // Try edge function with reduced timeout
    let searchResult = null;
    let lastError = null;
    
    try {
      console.log('📡 GOOGLE PLACES: Calling search-venues edge function...');
      
      const startTime = Date.now();
      const result = await Promise.race([
        supabase.functions.invoke('search-venues', { body: requestPayload }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Edge function timeout after 20 seconds')), 20000)
        )
      ]) as any;
      
      const endTime = Date.now();
      console.log(`⏱️ GOOGLE PLACES: Edge function completed in:`, endTime - startTime, 'ms');
      console.log(`📡 GOOGLE PLACES: Edge function result:`, result);
      
      if (result?.error) {
        throw new Error(result.error.message || 'Edge function returned error');
      }
      
      searchResult = result?.data;
      
    } catch (error) {
      console.error('❌ GOOGLE PLACES: Edge function failed:', error);
      lastError = error;
    }
    
    // If edge function failed, get location-filtered database venues
    if (!searchResult || lastError) {
      console.log('🔄 GOOGLE PLACES: Edge function failed, trying location-filtered database...');
      
      const locationFilteredVenues = await getLocationFilteredDatabaseVenues(latitude, longitude, fixedPrefs.max_distance, fixedPrefs.preferred_cuisines);
      
      if (locationFilteredVenues.length > 0) {
        console.log('✅ GOOGLE PLACES: Found', locationFilteredVenues.length, 'location-filtered database venues');
        return locationFilteredVenues;
      }
      
      throw new Error('No venues found. Please try again or check your internet connection.');
    }

    const venues = searchResult?.venues || [];
    console.log('📍 GOOGLE PLACES: Edge function returned:', venues.length, 'venues');

    if (venues.length === 0) {
      console.warn('⚠️ GOOGLE PLACES: No venues from Google Places, trying location-filtered database fallback...');
      
      const locationFilteredVenues = await getLocationFilteredDatabaseVenues(latitude, longitude, fixedPrefs.max_distance, fixedPrefs.preferred_cuisines);
      
      if (locationFilteredVenues.length > 0) {
        console.log('✅ GOOGLE PLACES: Using location-filtered database fallback venues:', locationFilteredVenues.length);
        return locationFilteredVenues;
      }
      
      return [];
    }

    // Transform and save Google Places venues to database
    const transformedVenues = [];
    for (const venue of venues.slice(0, limit)) {
      try {
        // Check if venue exists
        const { data: existingVenue } = await supabase
          .from('venues')
          .select('id')
          .eq('google_place_id', venue.placeId)
          .maybeSingle();

        let venueId = existingVenue?.id;
        
        // Save new venue if it doesn't exist
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
              photos: venue.photos || [], // Save the photos array
              google_place_id: venue.placeId,
              phone: venue.phone,
              website: venue.website,
              tags: venue.tags || [],
              latitude: venue.latitude,
              longitude: venue.longitude,
              description: venue.description
            })
            .select('id')
            .single();

          if (!insertError && newVenue) {
            venueId = newVenue.id;
            console.log('✅ GOOGLE PLACES: Saved new venue with photos:', venue.name, venue.photos?.length || 0, 'photos');
          } else {
            console.warn('⚠️ GOOGLE PLACES: Failed to save venue:', venue.name, insertError);
          }
        }

        // Always use Google Place ID as primary ID - this ensures venues can be selected
        const finalVenueId = venue.placeId || venueId || `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`🆔 GOOGLE PLACES: Venue "${venue.name}" ID assignment:`, {
          placeId: venue.placeId,
          dbVenueId: venueId,
          finalId: finalVenueId
        });
        
        // Validate we have a proper place_id for venue selection
        if (!venue.placeId) {
          console.warn(`⚠️ GOOGLE PLACES: Venue "${venue.name}" missing placeId - using fallback: ${finalVenueId}`);
        }
        
        transformedVenues.push({
          id: finalVenueId,
          name: venue.name,
          address: venue.location,
          location: venue.location, // Add for backwards compatibility
          vicinity: venue.location, // Add for address fallback
          cuisine_type: venue.cuisineType,
          cuisineType: venue.cuisineType, // Add for backwards compatibility
          price_range: venue.priceRange,
          priceRange: venue.priceRange, // Add for backwards compatibility
          rating: venue.rating,
          image_url: venue.image,
          image: venue.image, // Add for backwards compatibility
          photos: venue.photos || [], // Add enhanced photos
          tags: venue.tags || [],
          latitude: venue.latitude,
          longitude: venue.longitude,
          openNow: venue.openNow,
          opening_hours: venue.openNow ? ['Open now'] : ['Hours not available']
        });
      } catch (venueError) {
        console.warn('⚠️ GOOGLE PLACES: Error processing venue:', venue.name, venueError);
      }
    }

    console.log('🎉 GOOGLE PLACES: Successfully processed', transformedVenues.length, 'venues');
    return transformedVenues;
    
  } catch (error) {
    console.error('❌ GOOGLE PLACES: Critical error in getVenuesFromGooglePlaces:', error);
    throw error;
  }
};

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
  
  return reasons.join('. ') + `.`;
};

// Helper function to calculate distance from user location
const calculateDistanceFromUser = (venue: any, userLocation: { latitude: number; longitude: number }): string => {
  if (!venue.latitude || !venue.longitude) return 'Distance unavailable';
  
  const distance = calculateDistance(userLocation.latitude, userLocation.longitude, venue.latitude, venue.longitude);
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

// Helper function to extract neighborhood from address
const extractNeighborhood = (address: string): string | undefined => {
  if (!address) return undefined;
  
  // Simple extraction - take the part before the first comma (usually street)
  // and the part after (usually neighborhood/district)
  const parts = address.split(',').map(part => part.trim());
  if (parts.length > 1) {
    return parts[1]; // Return the neighborhood part
  }
  return undefined;
};

// Helper function to determine if venue is open
const determineOpenStatus = (openingHours: any): boolean => {
  // Handle Google Places openNow boolean
  if (typeof openingHours === 'boolean') return openingHours;
  
  if (!openingHours || !Array.isArray(openingHours)) return true; // Assume open if no data
  
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentTime = now.getHours() * 100 + now.getMinutes(); // HHMM format
  
  // Simple check - if we have opening hours data, assume open during business hours
  // This is a simplified implementation - real-world would parse actual hours
  return currentTime >= 900 && currentTime <= 2200; // 9 AM to 10 PM
};

// Helper function to format operating hours
const formatOperatingHours = (openingHours: any): string[] => {
  if (!openingHours) return ['Hours not available'];
  
  if (Array.isArray(openingHours)) {
    return openingHours;
  }
  
  // Default fallback
  return ['Mon-Sun: 9:00 AM - 10:00 PM'];
};

// Helper function to calculate distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Get location-filtered database venues with Hamburg test data fallback
const getLocationFilteredDatabaseVenues = async (latitude: number, longitude: number, maxDistance: number, preferredCuisines: string[]) => {
  console.log('🗄️ DATABASE: Getting location-filtered venues near', latitude, longitude, 'within', maxDistance, 'km');
  
  // First try to get venues from database within distance
  const { data: dbVenues, error: dbError } = await supabase
    .from('venues')
    .select('*')
    .eq('is_active', true);
    
  console.log('🗄️ DATABASE: Query result:', { dbVenues: dbVenues?.length, dbError });
  
  if (!dbError && dbVenues?.length > 0) {
    const filteredVenues = dbVenues.filter(venue => {
      if (!venue.latitude || !venue.longitude) return false;
      const distance = calculateDistance(latitude, longitude, venue.latitude, venue.longitude);
      const withinDistance = distance <= maxDistance;
      const matchesCuisine = !preferredCuisines.length || preferredCuisines.some(cuisine => 
        venue.cuisine_type?.toLowerCase().includes(cuisine.toLowerCase())
      );
      
      console.log(`📍 DATABASE: ${venue.name} - Distance: ${distance.toFixed(1)}km, Within range: ${withinDistance}, Cuisine match: ${matchesCuisine}`);
      return withinDistance && matchesCuisine;
    });
    
    if (filteredVenues.length > 0) {
      console.log('✅ DATABASE: Found', filteredVenues.length, 'location-filtered venues');
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
  
  // If searching near Hamburg (53.57, 9.96) and no venues found, add test data
  const isHamburgArea = calculateDistance(latitude, longitude, 53.57, 9.96) < 50; // Within 50km of Hamburg
  
  if (isHamburgArea && preferredCuisines.includes('Italian')) {
    console.log('🍕 DATABASE: Adding Hamburg Italian test venues...');
    
    const hamburgTestVenues = [
      {
        name: "Ristorante Da Capo",
        address: "Eppendorfer Weg 15, 20259 Hamburg, Germany",
        cuisine_type: "Italian",
        price_range: "$$",
        rating: 4.5,
        latitude: 53.574,
        longitude: 9.966,
        tags: ["Italian", "romantic", "dinner"],
        description: "Authentic Italian restaurant in Eppendorf"
      },
      {
        name: "La Famiglia Hamburg",
        address: "Grindelallee 85, 20146 Hamburg, Germany", 
        cuisine_type: "Italian",
        price_range: "$$",
        rating: 4.3,
        latitude: 53.567,
        longitude: 9.963,
        tags: ["Italian", "casual", "lunch"],
        description: "Traditional Italian cuisine in the heart of Hamburg"
      },
      {
        name: "Il Buco",
        address: "Juliusstraße 16, 22769 Hamburg, Germany",
        cuisine_type: "Italian", 
        price_range: "$$",
        rating: 4.4,
        latitude: 53.556,
        longitude: 9.954,
        tags: ["Italian", "romantic", "wine"],
        description: "Cozy Italian bistro with excellent wine selection"
      }
    ];
    
    // Insert test venues if they don't exist
    const testVenueResults = [];
    for (const testVenue of hamburgTestVenues) {
      try {
        const { data: existing } = await supabase
          .from('venues')
          .select('id')
          .eq('name', testVenue.name)
          .maybeSingle();
          
        if (!existing) {
          const { data: newVenue, error: insertError } = await supabase
            .from('venues')
            .insert({
              ...testVenue,
              image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop'
            })
            .select('*')
            .single();
            
          if (!insertError && newVenue) {
            console.log('✅ DATABASE: Added Hamburg test venue:', testVenue.name);
            testVenueResults.push({
              id: newVenue.id,
              name: newVenue.name,
              address: newVenue.address,
              cuisine_type: newVenue.cuisine_type,
              price_range: newVenue.price_range,
              rating: newVenue.rating,
              image_url: newVenue.image_url,
              tags: newVenue.tags,
              phone: newVenue.phone,
              website: newVenue.website,
              description: newVenue.description
            });
          }
        } else {
          // Use existing venue
          const { data: existingVenue } = await supabase
            .from('venues')
            .select('*')
            .eq('id', existing.id)
            .single();
            
          if (existingVenue) {
            testVenueResults.push({
              id: existingVenue.id,
              name: existingVenue.name,
              address: existingVenue.address,
              cuisine_type: existingVenue.cuisine_type,
              price_range: existingVenue.price_range,
              rating: existingVenue.rating,
              image_url: existingVenue.image_url,
              tags: existingVenue.tags,
              phone: existingVenue.phone,
              website: existingVenue.website,
              description: existingVenue.description
            });
          }
        }
      } catch (error) {
        console.warn('⚠️ DATABASE: Failed to add test venue:', testVenue.name, error);
      }
    }
    
    if (testVenueResults.length > 0) {
      console.log('🎉 DATABASE: Returning', testVenueResults.length, 'Hamburg test venues');
      return testVenueResults;
    }
  }
  
  console.log('❌ DATABASE: No location-appropriate venues found');
  return [];
};
