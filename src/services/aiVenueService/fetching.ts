
import { supabase } from '@/integrations/supabase/client';

export const getActiveVenues = async (limit: number = 50) => {
  try {
    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .select('*')
      .eq('is_active', true)
      .limit(limit);

    if (venuesError) throw venuesError;
    return venues;
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
