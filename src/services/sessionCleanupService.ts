import { supabase } from '@/integrations/supabase/client';

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