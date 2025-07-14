
import { calculateVenueAIScore, calculateConfidenceLevel } from './scoring';
import { getActiveVenues, getStoredAIScore } from './fetching';
import { supabase } from '@/integrations/supabase/client';

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
  limit: number = 10
): Promise<AIVenueRecommendation[]> => {
  try {
    console.log('🎯 RECOMMENDATIONS: Starting for user:', userId, 'partner:', partnerId);

    // First try to get real venues from Google Places API
    let venues = await getVenuesFromGooglePlaces(userId, limit);
    console.log('🌐 RECOMMENDATIONS: Google Places returned:', venues?.length || 0, 'venues');
    
    // Fallback to database venues if Google Places fails
    if (!venues || venues.length === 0) {
      console.log('🔄 RECOMMENDATIONS: No Google Places venues, falling back to database venues');
      venues = await getActiveVenues(50);
      console.log('🗄️ RECOMMENDATIONS: Database returned:', venues?.length || 0, 'venues');
    }

    // If still no venues, something is wrong
    if (!venues || venues.length === 0) {
      console.error('❌ RECOMMENDATIONS: No venues found from either source!');
      return [];
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
    console.error('Error getting AI venue recommendations:', error);
    return [];
  }
};

// Get venues from Google Places API based on user preferences
const getVenuesFromGooglePlaces = async (userId: string, limit: number) => {
  try {
    console.log('🔍 GOOGLE PLACES: Starting venue search for user:', userId);
    
    // Get user preferences
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefsError) {
      console.error('❌ GOOGLE PLACES: Error fetching user preferences:', prefsError);
      return [];
    }

    if (!userPrefs) {
      console.warn('⚠️ GOOGLE PLACES: No user preferences found');
      return [];
    }

    // Use mock user location for now (could be made dynamic)
    const location = 'San Francisco, CA';
    const latitude = 37.7749;
    const longitude = -122.4194;

    console.log('🏙️ GOOGLE PLACES: Searching venues with preferences:', {
      cuisines: userPrefs.preferred_cuisines,
      vibes: userPrefs.preferred_vibes,
      priceRange: userPrefs.preferred_price_range,
      location
    });

    // Call the search-venues edge function
    const { data: searchResult, error } = await supabase.functions.invoke('search-venues', {
      body: {
        location,
        cuisines: userPrefs.preferred_cuisines || ['italian'],
        vibes: userPrefs.preferred_vibes || ['romantic'],
        latitude,
        longitude,
        radius: (userPrefs.max_distance || 10) * 1609 // Convert miles to meters
      }
    });

    if (error) {
      console.error('❌ GOOGLE PLACES: Error calling search-venues function:', {
        message: error.message,
        details: error.details || 'No additional details'
      });
      return [];
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
