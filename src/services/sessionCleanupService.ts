import { supabase } from '@/integrations/supabase/client';

// Clear ONLY the logging out user's preferences (preserves partner data and session integrity)
export const clearUserPreferenceFields = async (userId: string): Promise<void> => {
  try {
    console.log('🧹 SESSION CLEANUP: Clearing ONLY user preferences for user:', userId);
    
    // Get all active sessions for this user to determine which role they have
    const { data: sessions, error: fetchError } = await supabase
      .from('date_planning_sessions')
      .select('*')
      .or(`initiator_id.eq.${userId},partner_id.eq.${userId}`)
      .eq('session_status', 'active');

    if (fetchError) {
      console.error('❌ SESSION CLEANUP: Error fetching user sessions:', fetchError);
      throw fetchError;
    }

    if (!sessions || sessions.length === 0) {
      console.log('✅ SESSION CLEANUP: No active sessions found for user');
      return;
    }

    // Process each session individually to calculate both_preferences_complete correctly
    for (const session of sessions) {
      const isInitiator = session.initiator_id === userId;
      let updateData: any = { updated_at: new Date().toISOString() };

      if (isInitiator) {
        // User is initiator - clear initiator preferences
        updateData.initiator_preferences = null;
        updateData.initiator_preferences_complete = false;
        // both_preferences_complete = partner still has preferences
        updateData.both_preferences_complete = session.partner_preferences_complete && !!session.partner_preferences;
      } else {
        // User is partner - clear partner preferences  
        updateData.partner_preferences = null;
        updateData.partner_preferences_complete = false;
        // both_preferences_complete = initiator still has preferences
        updateData.both_preferences_complete = session.initiator_preferences_complete && !!session.initiator_preferences;
      }

      console.log(`🔄 SESSION CLEANUP: Updating session ${session.id}:`, {
        userRole: isInitiator ? 'initiator' : 'partner',
        bothComplete: updateData.both_preferences_complete,
        partnerStillHasPrefs: isInitiator ? (session.partner_preferences_complete && !!session.partner_preferences) : (session.initiator_preferences_complete && !!session.initiator_preferences)
      });

      const { error: updateError } = await supabase
        .from('date_planning_sessions')
        .update(updateData)
        .eq('id', session.id);

      if (updateError) {
        console.error('❌ SESSION CLEANUP: Error updating session:', updateError);
        throw updateError;
      }
    }

    console.log('✅ SESSION CLEANUP: Successfully cleared user preferences, preserved partner data and session state');
  } catch (error) {
    console.error('❌ SESSION CLEANUP: Failed to clear user preference fields:', error);
    throw error;
  }
};

// Clean up all sessions for a user when they log out
export const expireUserSessions = async (userId: string): Promise<void> => {
  try {
    console.log('🧹 SESSION CLEANUP: Expiring all active sessions for user:', userId);
    
    const { error } = await supabase
      .from('date_planning_sessions')
      .update({ 
        session_status: 'expired',
        updated_at: new Date().toISOString()
      })
      .or(`initiator_id.eq.${userId},partner_id.eq.${userId}`)
      .eq('session_status', 'active');

    if (error) {
      console.error('❌ SESSION CLEANUP: Error expiring sessions:', error);
      throw error;
    }

    console.log('✅ SESSION CLEANUP: Successfully expired all active sessions for user');
  } catch (error) {
    console.error('❌ SESSION CLEANUP: Failed to expire user sessions:', error);
    throw error;
  }
};

// Reset a specific session to clean state
export const resetSessionToCleanState = async (sessionId: string): Promise<boolean> => {
  try {
    console.log('🔄 SESSION CLEANUP: Resetting session to clean state:', sessionId);
    
    const { error } = await supabase
      .from('date_planning_sessions')
      .update({
        initiator_preferences: null,
        partner_preferences: null,
        initiator_preferences_complete: false,
        partner_preferences_complete: false,
        both_preferences_complete: false,
        ai_compatibility_score: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('❌ SESSION CLEANUP: Error resetting session:', error);
      return false;
    }

    console.log('✅ SESSION CLEANUP: Session reset to clean state successfully');
    return true;
  } catch (error) {
    console.error('❌ SESSION CLEANUP: Error in resetSessionToCleanState:', error);
    return false;
  }
};