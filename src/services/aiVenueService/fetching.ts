
import { supabase } from '@/integrations/supabase/client';
import { filterBlockedVenues } from './venueBlocklist';

/**
 * cuisine_type values that our Overpass importer assigns to non-gastro venues,
 * grouped by situational category. Used as a last-resort DB fallback when a
 * culture / activity / nightlife intent produced no live results.
 */
export const CATEGORY_CUISINE_TYPES: Record<string, string[]> = {
  culture: [
    'Museum', 'Gallery', 'Theater', 'Cinema', 'Concert Hall',
    'Arts Centre', 'Planetarium', 'Library', 'Historic',
  ],
  activity: [
    'Bowling', 'Mini Golf', 'Arcade', 'Escape Room', 'Climbing', 'Swimming',
    'Spa & Wellness', 'Ice Rink', 'Trampoline Park', 'Go-Kart', 'Paintball',
    'Laser Tag',
  ],
  nightlife: ['Bar', 'Pub', 'Nightclub', 'Casino', 'Karaoke', 'Biergarten'],
};

/**
 * Fetch stored venues of a situational category within a bounding box.
 */
export const getActiveVenuesByCategory = async (
  categoryId: string,
  limit: number = 40,
  userLocation?: { latitude: number; longitude: number },
  radiusKm: number = 30,
) => {
  const cuisineTypes = CATEGORY_CUISINE_TYPES[categoryId];
  if (!cuisineTypes) return [];

  try {
    let query = supabase
      .from('venues')
      .select('*')
      .eq('is_active', true)
      .in('cuisine_type', cuisineTypes);

    if (userLocation?.latitude && userLocation?.longitude) {
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos(userLocation.latitude * Math.PI / 180));
      query = query
        .gte('latitude', userLocation.latitude - latDelta)
        .lte('latitude', userLocation.latitude + latDelta)
        .gte('longitude', userLocation.longitude - lngDelta)
        .lte('longitude', userLocation.longitude + lngDelta);
    }

    const { data, error } = await query.limit(limit);
    if (error) throw error;
    return filterBlockedVenues(data || []);
  } catch (error) {
    console.error('Error fetching category venues:', error);
    return [];
  }
};

export const getActiveVenues = async (
  limit: number = 50,
  userLocation?: { latitude: number; longitude: number },
  radiusKm: number = 25
) => {
  try {
    let query = supabase
      .from('venues')
      .select('*')
      .eq('is_active', true);

    // Filter by bounding box if location is provided
    if (userLocation?.latitude && userLocation?.longitude) {
      const latDelta = radiusKm / 111;
      const lngDelta = radiusKm / (111 * Math.cos(userLocation.latitude * Math.PI / 180));
      query = query
        .gte('latitude', userLocation.latitude - latDelta)
        .lte('latitude', userLocation.latitude + latDelta)
        .gte('longitude', userLocation.longitude - lngDelta)
        .lte('longitude', userLocation.longitude + lngDelta);
    }

    const { data: venues, error: venuesError } = await query.limit(limit);
    if (venuesError) throw venuesError;
    return filterBlockedVenues(venues || []);
  } catch (error) {
    console.error('Error fetching venues:', error);
    return [];
  }
};

export const getStoredAIScore = async (venueId: string, userId: string) => {
  try {
    const { data: scoreData } = await supabase
      .from('ai_venue_scores')
      .select('*')
      .eq('venue_id', venueId)
      .eq('user_id', userId)
      .single();

    return scoreData;
  } catch (error) {
    console.error('Error fetching stored AI score:', error);
    return null;
  }
};
