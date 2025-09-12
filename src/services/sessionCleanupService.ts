import { supabase } from '@/integrations/supabase/client';

// Clear user's preference fields from all active sessions (preserves partner data)
export const clearUserPreferenceFields = async (userId: string): Promise<void> => {
  try {
    console.log('🧹 SESSION CLEANUP: Clearing user preference fields for user:', userId);
    
    // Clear initiator preferences where user is the initiator
    const { error: initiatorError } = await supabase
      .from('date_planning_sessions')
      .update({
        initiator_preferences: null,
        initiator_preferences_complete: false,
        updated_at: new Date().toISOString()
      })
      .eq('initiator_id', userId)
      .eq('session_status', 'active');

    if (initiatorError) {
      console.error('❌ SESSION CLEANUP: Error clearing initiator preferences:', initiatorError);
      throw initiatorError;
    }

    // Clear partner preferences where user is the partner
    const { error: partnerError } = await supabase
      .from('date_planning_sessions')
      .update({
        partner_preferences: null,
        partner_preferences_complete: false,
        updated_at: new Date().toISOString()
      })
      .eq('partner_id', userId)
      .eq('session_status', 'active');

    if (partnerError) {
      console.error('❌ SESSION CLEANUP: Error clearing partner preferences:', partnerError);
      throw partnerError;
    }

    console.log('✅ SESSION CLEANUP: Successfully cleared user preference fields');
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