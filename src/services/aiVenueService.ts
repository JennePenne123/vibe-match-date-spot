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
}

const mapCuisineToGooglePlacesTypes = (cuisines: string[]): string[] => {
  const cuisineMap: { [key: string]: string } = {
    'Italienisch': 'italian_restaurant',
    'Asiatisch': 'asian_restaurant', 
    'Deutsch': 'german_restaurant',
    'Italian': 'italian_restaurant',
    'Asian': 'asian_restaurant',
    'German': 'german_restaurant'
  };
  
  return cuisines.map(cuisine => cuisineMap[cuisine] || 'restaurant').filter(Boolean);
};

const callEdgeFunctionWithTimeout = async (payload: any, timeoutMs: number = 45000) => {
  console.log('📡 VENUE SERVICE: Calling edge function with timeout:', timeoutMs + 'ms');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const result = await supabase.functions.invoke('search-venues', { 
      body: payload
    });
    
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Edge function timeout after ${timeoutMs/1000} seconds`);
    }
    
    throw error;
  }
};

export const getAIVenueRecommendations = async (
  userId: string,
  partnerId?: string,
  limit: number = 10,
  userLocation?: { latitude: number; longitude: number; address?: string }
): Promise<AIVenueRecommendation[]> => {
  try {
    console.log('🎯 RECOMMENDATIONS: Starting for user:', userId);

    const locationValidation = validateLocation(userLocation);
    if (!locationValidation.isValid) {
      throw new Error(locationValidation.error || 'Invalid user location provided');
    }

    let venues = await getVenuesFromGooglePlaces(userId, limit, userLocation);
    
    if (!venues || venues.length === 0) {
      const { data: dbVenues } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true)
        .limit(50);
      venues = dbVenues || [];
    }

    if (!venues || venues.length === 0) {
      throw new Error('No venues found in your area');
    }

    const recommendations: AIVenueRecommendation[] = [];

    for (const venue of venues) {
      const aiScore = Math.floor(Math.random() * 40) + 60; // Mock scoring
      
      const recommendation: AIVenueRecommendation = {
        venue_id: venue.id,
        venue_name: venue.name,
        venue_address: venue.address,
        venue_image: venue.image_url,
        venue_photos: venue.photos || [],
        ai_score: aiScore,
        match_factors: {},
        contextual_score: aiScore * 0.8,
        ai_reasoning: generateAIReasoning(venue, {}, aiScore),
        confidence_level: aiScore > 80 ? 0.9 : 0.7
      };

      recommendations.push(recommendation);
    }

    return recommendations
      .sort((a, b) => b.ai_score - a.ai_score)
      .slice(0, limit);

  } catch (error) {
    console.error('❌ RECOMMENDATIONS: Error:', error);
    throw new Error(error.message || 'Failed to get venue recommendations');
  }
};

const getVenuesFromGooglePlaces = async (userId: string, limit: number, userLocation?: { latitude: number; longitude: number; address?: string }) => {
  try {
    console.log('🔍 GOOGLE PLACES: Starting venue search');
    
    if (!userLocation?.latitude || !userLocation?.longitude) {
      throw new Error('Valid user location is required');
    }
    
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefsError || !userPrefs) {
      throw new Error('User preferences not found');
    }

    const fixedPrefs = {
      preferred_cuisines: userPrefs.preferred_cuisines?.length ? userPrefs.preferred_cuisines : ['Italian'],
      preferred_vibes: userPrefs.preferred_vibes?.length ? userPrefs.preferred_vibes : ['romantic'],
      max_distance: userPrefs.max_distance || 10
    };

    const requestPayload = {
      location: userLocation.address || `${userLocation.latitude}, ${userLocation.longitude}`,
      cuisines: mapCuisineToGooglePlacesTypes(fixedPrefs.preferred_cuisines),
      originalCuisines: fixedPrefs.preferred_cuisines,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      radius: Math.min(fixedPrefs.max_distance * 1609, 50000)
    };
    
    try {
      const result = await callEdgeFunctionWithTimeout(requestPayload, 45000);
      const venues = result?.data?.venues || [];
      
      if (venues.length === 0) {
        return getLocationFilteredDatabaseVenues(userLocation.latitude, userLocation.longitude, fixedPrefs.max_distance, fixedPrefs.preferred_cuisines);
      }

      return venues.slice(0, limit);
    } catch (error) {
      console.error('❌ GOOGLE PLACES: Edge function failed:', error);
      return getLocationFilteredDatabaseVenues(userLocation.latitude, userLocation.longitude, fixedPrefs.max_distance, fixedPrefs.preferred_cuisines);
    }
  } catch (error) {
    console.error('❌ GOOGLE PLACES: Error:', error);
    throw error;
  }
};

export const generateAIReasoning = (venue: any, matchFactors: any, aiScore: number): string => {
  const reasons = [];
  
  if (matchFactors?.cuisine_match) {
    reasons.push(`Perfect cuisine match with ${venue.cuisine_type}`);
  }
  
  if (venue.rating >= 4.0) {
    reasons.push(`Highly rated venue (${venue.rating}★)`);
  }
  
  if (reasons.length === 0) {
    return `Good overall match based on your preferences (${Math.round(aiScore)}% match)`;
  }
  
  return reasons.join('. ') + '.';
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const getLocationFilteredDatabaseVenues = async (latitude: number, longitude: number, maxDistance: number, preferredCuisines: string[]) => {
  const { data: dbVenues } = await supabase
    .from('venues')
    .select('*')
    .eq('is_active', true);
    
  if (dbVenues?.length > 0) {
    const filteredVenues = dbVenues.filter(venue => {
      if (!venue.latitude || !venue.longitude) return false;
      const distance = calculateDistance(latitude, longitude, venue.latitude, venue.longitude);
      return distance <= maxDistance;
    });
    
    if (filteredVenues.length > 0) {
      return filteredVenues;
    }
  }
  
  return [];
};