import { supabase } from '@/integrations/supabase/client';

// Update Jenne Penne's preferences for better test scenarios
export const updateJennePreferences = async () => {
  try {
    console.log('Updating Jenne Penne preferences for Smart Planner testing');
    
    const jennePreferences = {
      user_id: 'dbfe64ff-d75a-4032-af21-6c31bfdc4215', // Jenne Penne's ID
      preferred_cuisines: ['Italian', 'Japanese', 'Mexican'],
      preferred_price_range: ['$$', '$$$'],
      preferred_times: ['evening', 'night'],
      preferred_vibes: ['romantic', 'casual', 'lively'],
      max_distance: 18,
      dietary_restrictions: []
    };

    const { error } = await supabase
      .from('user_preferences')
      .upsert(jennePreferences, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating Jenne preferences:', error);
      throw error;
    }

    console.log('Jenne preferences updated successfully');
    return true;
  } catch (error) {
    console.error('Error in updateJennePreferences:', error);
    throw error;
  }
};

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