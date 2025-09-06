import { supabase } from '@/integrations/supabase/client';
import { detectPreferenceDuplication, clearTestUserData, isTestUser } from '@/services/testUserService';

interface SessionValidationResult {
  isValid: boolean;
  issues: string[];
  shouldReset: boolean;
}

// Validate session preferences for authenticity and detect duplication
export const validateSessionPreferences = async (sessionId: string): Promise<SessionValidationResult> => {
  try {
    console.log('🔍 VALIDATION: Checking session preferences for authenticity:', sessionId);
    
    const { data: session, error } = await supabase
      .from('date_planning_sessions')
      .select('*, profiles!date_planning_sessions_initiator_id_fkey(email), profiles!date_planning_sessions_partner_id_fkey(email)')
      .eq('id', sessionId)
      .single();

    if (error) {
      return { isValid: false, issues: ['Session not found'], shouldReset: false };
    }

    const issues: string[] = [];
    let shouldReset = false;

    // Check if both users are test users
    const initiatorEmail = session.profiles?.email;
    const partnerEmail = session.profiles?.email; 
    const bothAreTestUsers = initiatorEmail && partnerEmail && 
      isTestUser(initiatorEmail) && isTestUser(partnerEmail);

    if (bothAreTestUsers) {
      console.log('🧪 VALIDATION: Both users are test users - applying strict validation');
    }

    // Check for preference duplication
    if (session.initiator_preferences && session.partner_preferences) {
      const isDuplicated = detectPreferenceDuplication(
        session.initiator_preferences,
        session.partner_preferences
      );

      if (isDuplicated) {
        issues.push('Identical preferences detected between users (likely copied/inherited)');
        shouldReset = true;
        
        // If test users, automatically clear their data
        if (bothAreTestUsers) {
          console.log('🧹 VALIDATION: Auto-clearing test user data due to preference duplication');
          await clearTestUserData(session.initiator_id);
          await clearTestUserData(session.partner_id);
        }
      }
    }

    // Check for preference flag consistency
    const hasInitiatorPrefs = !!session.initiator_preferences;
    const hasPartnerPrefs = !!session.partner_preferences;
    
    if (session.initiator_preferences_complete && !hasInitiatorPrefs) {
      issues.push('Initiator marked complete but has no preference data');
      shouldReset = true;
    }

    if (session.partner_preferences_complete && !hasPartnerPrefs) {
      issues.push('Partner marked complete but has no preference data');
      shouldReset = true;
    }

    // Check for suspicious timing (both preferences set within seconds of each other)
    if (session.initiator_preferences && session.partner_preferences) {
      // This would require timestamp tracking - for now just flag the duplication
      if (detectPreferenceDuplication(session.initiator_preferences, session.partner_preferences)) {
        issues.push('Preferences set too similarly - suspicious timing');
      }
    }

    const isValid = issues.length === 0;
    
    console.log('🔍 VALIDATION: Session validation result:', {
      sessionId,
      isValid,
      issues,
      shouldReset,
      bothAreTestUsers
    });

    return { isValid, issues, shouldReset };

  } catch (error) {
    console.error('❌ VALIDATION: Error validating session:', error);
    return { isValid: false, issues: ['Validation error'], shouldReset: false };
  }
};

// Reset session to clean state
export const resetSessionToCleanState = async (sessionId: string): Promise<boolean> => {
  try {
    console.log('🔄 VALIDATION: Resetting session to clean state:', sessionId);
    
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
      console.error('❌ VALIDATION: Error resetting session:', error);
      return false;
    }

    console.log('✅ VALIDATION: Session reset to clean state successfully');
    return true;
  } catch (error) {
    console.error('❌ VALIDATION: Error in resetSessionToCleanState:', error);
    return false;
  }
};