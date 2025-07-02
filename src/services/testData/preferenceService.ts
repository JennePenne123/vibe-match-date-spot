import { supabase } from '@/integrations/supabase/client';

export const createTestUserPreferences = async (currentUserId: string) => {
  try {
    console.log('Creating test preferences for user:', currentUserId);
    
    const userPreferences = {
      user_id: currentUserId,
      preferred_cuisines: ['Italian', 'Japanese'],
      preferred_price_range: ['$$', '$$$'],
      preferred_times: ['evening', 'night'],
      preferred_vibes: ['romantic', 'upscale'],
      max_distance: 15,
      dietary_restrictions: []
    };

    const { error } = await supabase
      .from('user_preferences')
      .upsert(userPreferences, { onConflict: 'user_id' });

    if (error) {
      console.error('Error creating user preferences:', error);
      throw error;
    }

    console.log('User preferences created successfully');
    return true;
  } catch (error) {
    console.error('Error in createTestUserPreferences:', error);
    throw error;
  }
};