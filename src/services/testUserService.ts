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
    console.log('🧹 ENHANCED: Clearing ALL test user data for user:', userId);
    
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

    // Clear ALL planning sessions where user is involved (not just active ones)
    const { error: allSessionsError } = await supabase
      .from('date_planning_sessions')
      .delete()
      .or(`initiator_id.eq.${userId},partner_id.eq.${userId}`);
    
    if (allSessionsError) {
      console.error('Error clearing ALL planning sessions:', allSessionsError);
    } else {
      console.log('✅ Cleared ALL planning sessions');
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

    // Clear user venue feedback
    const { error: feedbackError } = await supabase
      .from('user_venue_feedback')
      .delete()
      .eq('user_id', userId);
    
    if (feedbackError) {
      console.error('Error clearing venue feedback:', feedbackError);
    } else {
      console.log('✅ Cleared venue feedback');
    }

    // Clear date invitations
    const { error: invitationsError } = await supabase
      .from('date_invitations')
      .delete()
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    
    if (invitationsError) {
      console.error('Error clearing invitations:', invitationsError);
    } else {
      console.log('✅ Cleared date invitations');
    }

    console.log('🎉 ENHANCED: Test user data clearing completed - user has completely clean slate');
  } catch (error) {
    console.error('❌ Error in clearTestUserData:', error);
    throw error;
  }
};

// New function to detect suspicious preference duplication
export const detectPreferenceDuplication = (prefs1: any, prefs2: any): boolean => {
  if (!prefs1 || !prefs2) return false;
  
  // Check if all preference arrays are identical
  const cuisinesMatch = JSON.stringify(prefs1.preferred_cuisines?.sort()) === JSON.stringify(prefs2.preferred_cuisines?.sort());
  const vibesMatch = JSON.stringify(prefs1.preferred_vibes?.sort()) === JSON.stringify(prefs2.preferred_vibes?.sort());
  const timesMatch = JSON.stringify(prefs1.preferred_times?.sort()) === JSON.stringify(prefs2.preferred_times?.sort());
  const priceMatch = JSON.stringify(prefs1.preferred_price_range?.sort()) === JSON.stringify(prefs2.preferred_price_range?.sort());
  const distanceMatch = prefs1.max_distance === prefs2.max_distance;
  
  // If ALL preferences match exactly, it's suspicious
  const isIdentical = cuisinesMatch && vibesMatch && timesMatch && priceMatch && distanceMatch;
  
  if (isIdentical) {
    console.warn('🚨 SUSPICIOUS: Detected identical preferences between users - likely duplication');
    console.log('🔍 Preference comparison:', {
      prefs1: {
        cuisines: prefs1.preferred_cuisines,
        vibes: prefs1.preferred_vibes,
        times: prefs1.preferred_times,
        price: prefs1.preferred_price_range,
        distance: prefs1.max_distance
      },
      prefs2: {
        cuisines: prefs2.preferred_cuisines,
        vibes: prefs2.preferred_vibes,
        times: prefs2.preferred_times,
        price: prefs2.preferred_price_range,
        distance: prefs2.max_distance
      }
    });
  }
  
  return isIdentical;
};

// Clear all test user data immediately (for debugging)
export const clearAllTestUsersData = async (): Promise<void> => {
  try {
    console.log('🧹 EMERGENCY: Clearing ALL test users data');
    
    // Get all test user IDs from profiles
    const { data: testProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .in('email', TEST_USER_EMAILS);
    
    if (profileError) {
      console.error('Error fetching test user profiles:', profileError);
      return;
    }
    
    if (!testProfiles || testProfiles.length === 0) {
      console.log('No test users found in profiles');
      return;
    }
    
    console.log('Found test users:', testProfiles.map(p => ({ id: p.id, email: p.email })));
    
    // Clear data for each test user
    for (const profile of testProfiles) {
      await clearTestUserData(profile.id);
    }
    
    console.log('🎉 EMERGENCY: All test users cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing all test users:', error);
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