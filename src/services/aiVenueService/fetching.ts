
import { supabase } from '@/integrations/supabase/client';

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
      const latDelta = radiusKm / 111; // ~111km per degree latitude
      const lngDelta = radiusKm / (111 * Math.cos(userLocation.latitude * Math.PI / 180));
      query = query
        .gte('latitude', userLocation.latitude - latDelta)
        .lte('latitude', userLocation.latitude + latDelta)
        .gte('longitude', userLocation.longitude - lngDelta)
        .lte('longitude', userLocation.longitude + lngDelta);
    }

    const { data: venues, error: venuesError } = await query.limit(limit);
    if (venuesError) throw venuesError;
    return venues || [];
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
