import { supabase } from '@/integrations/supabase/client';

// Update Jenne Penne's preferences for better test scenarios
export const updateJennePreferences = async () => {
  try {
    console.log('Updating Jenne Penne preferences for Smart Planner testing');
    
    const { error } = await supabase.rpc('setup_test_user_preferences', {
      target_user_id: 'dbfe64ff-d75a-4032-af21-6c31bfdc4215', // Jenne Penne's ID
      cuisines: ['Italian', 'Japanese', 'Mexican'],
      price_range: ['$$', '$$$'],
      times: ['evening', 'night'],
      vibes: ['romantic', 'casual', 'lively'],
      max_dist: 18,
      dietary: []
    });

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
    
    const { error } = await supabase.rpc('setup_test_user_preferences', {
      target_user_id: currentUserId,
      cuisines: ['Italian', 'Japanese'],
      price_range: ['$$', '$$$'],
      times: ['evening', 'night'],
      vibes: ['romantic', 'upscale'],
      max_dist: 15,
      dietary: []
    });

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