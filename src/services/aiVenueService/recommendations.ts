
import { calculateVenueAIScore, calculateConfidenceLevel } from './scoring';
import { getActiveVenues, getStoredAIScore } from './fetching';
import { supabase } from '@/integrations/supabase/client';
import { validateLocation } from '@/utils/locationValidation';

export interface AIVenueRecommendation {
  venue_id: string;
  venue_name: string;
  venue_address: string;
  venue_image?: string;
  ai_score: number;
  match_factors: any;
  contextual_score: number;
  ai_reasoning: string;
  confidence_level: number;
}

export const getAIVenueRecommendations = async (
  userId: string,
  partnerId?: string,
  limit: number = 10,
  userLocation?: { latitude: number; longitude: number; address?: string }
): Promise<AIVenueRecommendation[]> => {
  try {
    console.log('🎯 RECOMMENDATIONS: Starting for user:', userId, 'partner:', partnerId, 'location:', userLocation);

    // Validate user location using comprehensive validation
    const locationValidation = validateLocation(userLocation);
    if (!locationValidation.isValid) {
      console.error('❌ RECOMMENDATIONS: Location validation failed:', locationValidation.error);
      throw new Error(locationValidation.error || 'Invalid user location provided');
    }

    // Only use Google Places API with real user location
    console.log('🌐 RECOMMENDATIONS: Getting venues from Google Places with real location:', userLocation);
    let venues = await getVenuesFromGooglePlaces(userId, limit, userLocation);
    console.log('🌐 RECOMMENDATIONS: Google Places returned:', venues?.length || 0, 'venues');
    
    // Only fallback to database venues if Google Places fails (no mock data)
    if (!venues || venues.length === 0) {
      console.log('🔄 RECOMMENDATIONS: Google Places failed, trying database venues');
      venues = await getActiveVenues(50);
      console.log('🗄️ RECOMMENDATIONS: Database returned:', venues?.length || 0, 'venues');
    }

    // If still no venues, return empty array with clear error
    if (!venues || venues.length === 0) {
      console.error('❌ RECOMMENDATIONS: No venues found! Google Places and database both empty.');
      throw new Error('No venues found in your area. Please try a different location or check your internet connection.');
    }

    const recommendations: AIVenueRecommendation[] = [];

    // Calculate AI scores for each venue
    console.log('🧮 RECOMMENDATIONS: Calculating AI scores for', venues.length, 'venues');
    for (const venue of venues) {
      console.log(`📊 RECOMMENDATIONS: Scoring venue: ${venue.name} (${venue.cuisine_type || 'unknown cuisine'})`);
      const aiScore = await calculateVenueAIScore(venue.id, userId, partnerId);
      
      // Get stored AI score data for additional context
      const scoreData = await getStoredAIScore(venue.id, userId);

      const recommendation: AIVenueRecommendation = {
        venue_id: venue.id,
        venue_name: venue.name,
        venue_address: venue.address,
        venue_image: venue.image_url,
        ai_score: aiScore,
        match_factors: scoreData?.match_factors || {},
        contextual_score: scoreData?.contextual_score || 0,
        ai_reasoning: generateAIReasoning(venue, scoreData?.match_factors, aiScore),
        confidence_level: calculateConfidenceLevel(aiScore, scoreData?.match_factors)
      };

      console.log(`✅ RECOMMENDATIONS: ${venue.name} scored ${aiScore}% (confidence: ${Math.round(recommendation.confidence_level * 100)}%)`);
      recommendations.push(recommendation);
    }

    // Sort by AI score and return top recommendations
    // Ensure we always return some venues even if scores are low
    const sortedRecommendations = recommendations
      .sort((a, b) => b.ai_score - a.ai_score)
      .slice(0, limit);

    console.log(`🎉 RECOMMENDATIONS: Returning ${sortedRecommendations.length} venue recommendations:`,
      sortedRecommendations.slice(0, 3).map(r => `${r.venue_name}: ${r.ai_score}%`));
    return sortedRecommendations;
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

    // Validate and fix preferences
    const fixedPrefs = {
      preferred_cuisines: userPrefs.preferred_cuisines?.length ? userPrefs.preferred_cuisines : ['Italian'],
      preferred_vibes: userPrefs.preferred_vibes?.length ? userPrefs.preferred_vibes : ['romantic'],
      preferred_times: userPrefs.preferred_times?.length ? userPrefs.preferred_times : ['lunch'],
      preferred_price_range: userPrefs.preferred_price_range?.length ? userPrefs.preferred_price_range : ['$$'],
      max_distance: userPrefs.max_distance || 10
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

    // Try edge function with retry logic
    let searchResult = null;
    let lastError = null;
    const maxRetries = 2;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📡 GOOGLE PLACES: Attempt ${attempt}/${maxRetries} - Calling search-venues edge function...`);
        
        const startTime = Date.now();
        const result = await Promise.race([
          supabase.functions.invoke('search-venues', { body: requestPayload }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Edge function timeout after 30 seconds')), 30000)
          )
        ]) as any;
        
        const endTime = Date.now();
        console.log(`⏱️ GOOGLE PLACES: Attempt ${attempt} completed in:`, endTime - startTime, 'ms');
        console.log(`📡 GOOGLE PLACES: Attempt ${attempt} result:`, result);
        
        if (result?.error) {
          throw new Error(result.error.message || 'Edge function returned error');
        }
        
        searchResult = result?.data;
        lastError = null;
        break; // Success, exit retry loop
        
      } catch (error) {
        console.error(`❌ GOOGLE PLACES: Attempt ${attempt} failed:`, error);
        lastError = error;
        
        if (attempt < maxRetries) {
          console.log(`🔄 GOOGLE PLACES: Retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // If all retries failed, try database fallback
    if (!searchResult || lastError) {
      console.log('🔄 GOOGLE PLACES: All retries failed, using enhanced database fallback...');
      
      const { data: dbVenues, error: dbError } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true)
        .ilike('cuisine_type', `%${fixedPrefs.preferred_cuisines[0]}%`)
        .limit(10);
        
      if (dbError) {
        console.error('❌ GOOGLE PLACES: Database fallback failed:', dbError);
        throw new Error(`Venue search failed: ${lastError?.message || 'Unknown error'}`);
      }
      
      if (dbVenues && dbVenues.length > 0) {
        console.log('✅ GOOGLE PLACES: Using database fallback venues:', dbVenues.length);
        
        // Transform database venues with enhanced data
        return dbVenues.map(venue => ({
          id: venue.id,
          name: venue.name,
          address: venue.address,
          cuisine_type: venue.cuisine_type,
          price_range: venue.price_range,
          rating: venue.rating,
          image_url: venue.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
          tags: venue.tags || [],
          phone: venue.phone,
          website: venue.website,
          description: venue.description || 'Great local venue'
        }));
      }
      
      throw new Error('No venues found in your area. Please try a different location or expand your search radius.');
    }

    const venues = searchResult?.venues || [];
    console.log('📍 GOOGLE PLACES: Edge function returned:', venues.length, 'venues');

    if (venues.length === 0) {
      console.warn('⚠️ GOOGLE PLACES: No venues from Google Places, trying database fallback...');
      
      const { data: dbVenues, error: dbError } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true)
        .limit(10);
        
      if (!dbError && dbVenues?.length > 0) {
        console.log('✅ GOOGLE PLACES: Using database fallback venues:', dbVenues.length);
        return dbVenues.map(venue => ({
          id: venue.id,
          name: venue.name,
          address: venue.address,
          cuisine_type: venue.cuisine_type,
          price_range: venue.price_range,
          rating: venue.rating,
          image_url: venue.image_url,
          tags: venue.tags || []
        }));
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
            console.log('✅ GOOGLE PLACES: Saved new venue:', venue.name);
          } else {
            console.warn('⚠️ GOOGLE PLACES: Failed to save venue:', venue.name, insertError);
          }
        }

        if (venueId) {
          transformedVenues.push({
            id: venueId,
            name: venue.name,
            address: venue.location,
            cuisine_type: venue.cuisineType,
            price_range: venue.priceRange,
            rating: venue.rating,
            image_url: venue.image,
            tags: venue.tags || []
          });
        }
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

// Mock venues function removed - only real venues allowed
