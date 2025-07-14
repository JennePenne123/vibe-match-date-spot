
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

// Get venues from Google Places API based on user preferences and location
const getVenuesFromGooglePlaces = async (userId: string, limit: number, userLocation?: { latitude: number; longitude: number; address?: string }) => {
  try {
    console.log('🔍 GOOGLE PLACES: Starting venue search for user:', userId, 'at location:', userLocation);
    console.log('🔍 GOOGLE PLACES: Function called with params:', { userId, limit, userLocation });
    
    // Early validation check
    if (!userId) {
      console.error('❌ GOOGLE PLACES: No userId provided!');
      throw new Error('User ID is required for venue search');
    }
    
    if (!userLocation?.latitude || !userLocation?.longitude) {
      console.error('❌ GOOGLE PLACES: Invalid location provided:', userLocation);
      throw new Error('Valid user location is required for venue search');
    }
    
    // Get user preferences
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('👤 GOOGLE PLACES: User preferences query result:', { userPrefs, prefsError });

    if (prefsError) {
      console.error('❌ GOOGLE PLACES: Error fetching user preferences:', prefsError);
      return [];
    }

    if (!userPrefs) {
      console.warn('⚠️ GOOGLE PLACES: No user preferences found for user:', userId);
      return [];
    }

    // Validate and fix preferences with detailed logging
    console.log('🔍 PREFERENCES CHECK: Raw preferences:', {
      cuisines: userPrefs.preferred_cuisines,
      vibes: userPrefs.preferred_vibes,
      times: userPrefs.preferred_times,
      priceRange: userPrefs.preferred_price_range
    });

    if (!userPrefs.preferred_price_range || userPrefs.preferred_price_range.length === 0) {
      console.error('❌ GOOGLE PLACES: User has empty price range preferences!', userPrefs);
      userPrefs.preferred_price_range = ['$$'];
    }

    if (!userPrefs.preferred_cuisines || userPrefs.preferred_cuisines.length === 0) {
      console.warn('⚠️ GOOGLE PLACES: User has empty cuisine preferences, using default');
      userPrefs.preferred_cuisines = ['italian'];
    }

    if (!userPrefs.preferred_vibes || userPrefs.preferred_vibes.length === 0) {
      console.warn('⚠️ GOOGLE PLACES: User has empty vibe preferences, using default');
      userPrefs.preferred_vibes = ['romantic'];
    }

    // Handle empty preferred_times which was causing issues
    if (!userPrefs.preferred_times || userPrefs.preferred_times.length === 0) {
      console.error('❌ GOOGLE PLACES: CRITICAL FIX - User has empty time preferences! This was breaking the flow.');
      console.log('🔧 GOOGLE PLACES: Fixing empty preferred_times array...');
      userPrefs.preferred_times = ['lunch'];
      
      // Update the database to fix this permanently
      await supabase
        .from('user_preferences')
        .update({ preferred_times: ['lunch'] })
        .eq('user_id', userId);
      console.log('✅ GOOGLE PLACES: Fixed user preferences in database');
    }

    console.log('✅ PREFERENCES FIXED: Final preferences:', {
      cuisines: userPrefs.preferred_cuisines,
      vibes: userPrefs.preferred_vibes,
      times: userPrefs.preferred_times,
      priceRange: userPrefs.preferred_price_range
    });

    // Validate user location before Google Places call
    const locationValidation = validateLocation(userLocation);
    if (!locationValidation.isValid) {
      console.error('❌ GOOGLE PLACES: Location validation failed:', locationValidation.error);
      throw new Error(locationValidation.error || 'Invalid user location for Google Places search');
    }

    const latitude = userLocation.latitude;
    const longitude = userLocation.longitude;
    const location = userLocation.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    console.log('🏙️ GOOGLE PLACES: Searching venues with preferences:', {
      cuisines: userPrefs.preferred_cuisines,
      vibes: userPrefs.preferred_vibes,
      priceRange: userPrefs.preferred_price_range,
      location,
      latitude,
      longitude,
      radius: (userPrefs.max_distance || 10) * 1609
    });

    // ===== EDGE FUNCTION CALL DEBUGGING =====
    console.log('🚀 GOOGLE PLACES: ===== STARTING EDGE FUNCTION CALL =====');
    console.log('🚀 GOOGLE PLACES: About to call search-venues edge function...');
    console.log('🚀 GOOGLE PLACES: Edge function parameters:', {
      functionName: 'search-venues',
      body: {
        location,
        cuisines: userPrefs.preferred_cuisines || ['italian'],
        vibes: userPrefs.preferred_vibes || ['romantic'],
        latitude,
        longitude,
        radius: (userPrefs.max_distance || 10) * 1609
      }
    });
    
    // Test edge function accessibility first
    console.log('🧪 GOOGLE PLACES: Testing edge function accessibility...');
    
    let searchResult, error;
    try {
      console.log('📡 GOOGLE PLACES: Calling supabase.functions.invoke...');
      
      const startTime = Date.now();
      const edgeFunctionCall = supabase.functions.invoke('search-venues', {
        body: {
          location,
          cuisines: userPrefs.preferred_cuisines || ['italian'],
          vibes: userPrefs.preferred_vibes || ['romantic'],
          latitude,
          longitude,
          radius: (userPrefs.max_distance || 10) * 1609 // Convert miles to meters
        }
      });
      
      console.log('⏱️ GOOGLE PLACES: Edge function call initiated, waiting for response...');
      
      // Create timeout promise (60 seconds for debugging)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Edge function timeout after 60 seconds')), 60000);
      });
      
      const result = await Promise.race([edgeFunctionCall, timeoutPromise]) as { data: any; error: any };
      const endTime = Date.now();
      
      console.log('⏱️ GOOGLE PLACES: Edge function completed in:', endTime - startTime, 'ms');
      console.log('📡 GOOGLE PLACES: Raw edge function result:', {
        hasData: !!result.data,
        hasError: !!result.error,
        dataKeys: result.data ? Object.keys(result.data) : [],
        errorMessage: result.error?.message
      });
      
      searchResult = result.data;
      error = result.error;
      
    } catch (timeoutError) {
      console.error('❌ GOOGLE PLACES: Edge function timed out or threw error:', timeoutError);
      console.error('❌ GOOGLE PLACES: Timeout error details:', {
        name: timeoutError.name,
        message: timeoutError.message,
        stack: timeoutError.stack
      });
      error = timeoutError;
    }

    // ===== DETAILED RESPONSE ANALYSIS =====
    console.log('📡 GOOGLE PLACES: ===== ANALYZING EDGE FUNCTION RESPONSE =====');
    console.log('📡 GOOGLE PLACES: Edge function response details:', { 
      success: !error, 
      hasData: !!searchResult,
      dataType: typeof searchResult,
      venueCount: searchResult?.venues?.length || 0,
      error: error?.message || 'none',
      Hamburg_debug: location.includes('Hamburg') ? 'HAMBURG SEARCH DETECTED' : 'Not Hamburg',
      fullResult: searchResult,
      fullError: error
    });

    if (error) {
      console.error('❌ GOOGLE PLACES: ===== EDGE FUNCTION ERROR DETECTED =====');
      console.error('❌ GOOGLE PLACES: Error calling search-venues function:', {
        errorType: typeof error,
        errorName: error.name,
        message: error.message,
        details: error.details || 'No additional details',
        stack: error.stack,
        Hamburg_location: location.includes('Hamburg') ? `SEARCHING HAMBURG: ${latitude}, ${longitude}` : 'Different location',
        isTimeoutError: error.message?.includes('timeout'),
        isNetworkError: error.message?.includes('network') || error.message?.includes('fetch'),
        isAuthError: error.message?.includes('auth') || error.message?.includes('unauthorized')
      });
      
      // Try to implement fallback strategy
      console.log('🔄 GOOGLE PLACES: Attempting fallback to database venues...');
      
      try {
        const { data: dbVenues, error: dbError } = await supabase
          .from('venues')
          .select('*')
          .eq('is_active', true)
          .limit(10);
          
        if (dbError) {
          console.error('❌ GOOGLE PLACES: Database fallback also failed:', dbError);
          throw error; // Re-throw original error
        }
        
        if (dbVenues && dbVenues.length > 0) {
          console.log('✅ GOOGLE PLACES: Using database fallback venues:', dbVenues.length);
          
          // Transform database venues to expected format
          const transformedVenues = dbVenues.map(venue => ({
            id: venue.id,
            name: venue.name,
            description: venue.description || 'Great local venue',
            image: venue.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
            rating: venue.rating || 4.0,
            distance: '0.5 mi', // Default distance for database venues
            priceRange: venue.price_range || '$$',
            location: venue.address,
            cuisineType: venue.cuisine_type || 'International',
            vibe: 'casual',
            matchScore: 75,
            tags: venue.tags || [],
            phone: venue.phone,
            website: venue.website
          }));
          
          return transformedVenues;
        }
      } catch (fallbackError) {
        console.error('❌ GOOGLE PLACES: Fallback strategy failed:', fallbackError);
      }
      
      // Throw error to be caught by parent function for user feedback
      throw new Error(`Failed to search venues: ${error.message}. Please check your internet connection and try again.`);
    }

    const venues = searchResult?.venues || [];
    console.log('📍 GOOGLE PLACES: Edge function returned:', venues.length, 'venues');

    if (venues.length === 0) {
      console.warn('⚠️ GOOGLE PLACES: No venues returned from edge function');
      return [];
    }

    // Transform and save venues to database
    const transformedVenues = [];
    for (const venue of venues.slice(0, limit)) {
      // Save venue to database if not exists
      const { data: existingVenue } = await supabase
        .from('venues')
        .select('id')
        .eq('google_place_id', venue.placeId)
        .single();

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
          console.log('Saved new venue to database:', venue.name);
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
    }

    return transformedVenues;
  } catch (error) {
    console.error('Error getting venues from Google Places:', error);
    return [];
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
