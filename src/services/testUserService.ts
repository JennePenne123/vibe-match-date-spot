import { supabase } from '@/integrations/supabase/client';

// Test users that should have their data cleared on logout
const TEST_USER_EMAILS = [
  'info@janwiechmann.de',
  'janwiechmann@hotmail.com'
];

export const isTestUser = (email: string): boolean => {
  return TEST_USER_EMAILS.includes(email.toLowerCase());
};

export const clearTestUserData = async (userId: string): Promise<void> => {
  try {
    console.log('🧹 Clearing test user data for user:', userId);
    
    // Clear user preferences completely
    const { error: prefsError } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId);
    
    if (prefsError) {
      console.error('Error clearing user preferences:', prefsError);
    } else {
      console.log('✅ Cleared user preferences');
    }

    // Clear any active planning sessions where user is involved
    const { error: sessionsError } = await supabase
      .from('date_planning_sessions')
      .delete()
      .or(`initiator_id.eq.${userId},partner_id.eq.${userId}`)
      .eq('session_status', 'active');
    
    if (sessionsError) {
      console.error('Error clearing planning sessions:', sessionsError);
    } else {
      console.log('✅ Cleared active planning sessions');
    }

    // Clear AI compatibility scores
    const { error: scoresError } = await supabase
      .from('ai_compatibility_scores')
      .delete()
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
    
    if (scoresError) {
      console.error('Error clearing compatibility scores:', scoresError);
    } else {
      console.log('✅ Cleared compatibility scores');
    }

    // Clear venue scores
    const { error: venueScoresError } = await supabase
      .from('ai_venue_scores')
      .delete()
      .eq('user_id', userId);
    
    if (venueScoresError) {
      console.error('Error clearing venue scores:', venueScoresError);
    } else {
      console.log('✅ Cleared venue scores');
    }

    console.log('🎉 Test user data clearing completed');
  } catch (error) {
    console.error('❌ Error in clearTestUserData:', error);
    throw error;
  }
};

export const ensureFreshTestUserStart = async (userId: string, email: string): Promise<void> => {
  if (!isTestUser(email)) return;
  
  try {
    console.log('🔄 Ensuring fresh start for test user:', email);
    
    // Clear any existing data to ensure completely fresh start
    await clearTestUserData(userId);
    
    console.log('✨ Test user ready for fresh session');
  } catch (error) {
    console.error('Error ensuring fresh test user start:', error);
  }
};