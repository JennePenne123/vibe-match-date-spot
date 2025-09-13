import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionRealtime } from '@/hooks/useSessionRealtime';

interface DatePlanningSession {
  id: string;
  initiator_id: string;
  partner_id: string;
  session_status: 'active' | 'completed' | 'expired';
  preferences_data?: any;
  initiator_preferences?: any;
  partner_preferences?: any;
  ai_compatibility_score?: number;
  selected_venue_id?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  initiator_preferences_complete: boolean;
  partner_preferences_complete: boolean;
  both_preferences_complete: boolean;
  planning_mode: string;
}

export const useCollaborativeSession = (sessionId: string | null) => {
  const { user } = useAuth();
  const [session, setSession] = useState<DatePlanningSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get session details with validation
  const fetchSession = async (id: string, forceRefresh = false) => {
    if (!user) {
      console.log('🔧 SESSION: No user found, skipping fetch');
      return;
    }
    
    console.log('🔧 SESSION: Fetching session', { id, userId: user.id, forceRefresh });
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('date_planning_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('🔧 SESSION: Database error:', error);
        throw error;
      }

      console.log('🔧 SESSION: Raw data from database:', {
        sessionId: data.id,
        initiator_id: data.initiator_id,
        partner_id: data.partner_id,
        initiator_preferences_complete: data.initiator_preferences_complete,
        partner_preferences_complete: data.partner_preferences_complete,
        both_preferences_complete: data.both_preferences_complete,
        has_initiator_prefs: !!data.initiator_preferences,
        has_partner_prefs: !!data.partner_preferences,
        session_status: data.session_status
      });

      // Enhanced validation: Check for preference data consistency AND duplication
      const hasInitiatorPrefsData = !!data.initiator_preferences;
      const hasPartnerPrefsData = !!data.partner_preferences;
      
      let needsUpdate = false;
      const updates: any = {};

      // Import preference duplication detection
      const { detectPreferenceDuplication } = await import('@/services/testUserService');
      
      // Check for suspicious preference duplication - but only if BOTH users are complete AND we have a compatibility score
      // This prevents false positives during normal preference setting flow
      if (hasInitiatorPrefsData && hasPartnerPrefsData && 
          data.initiator_preferences_complete && data.partner_preferences_complete && 
          data.ai_compatibility_score !== null) {
        const isDuplicated = detectPreferenceDuplication(data.initiator_preferences, data.partner_preferences);
        
        if (isDuplicated) {
          console.warn('⚠️ SESSION: PREFERENCE DUPLICATION DETECTED - but allowing for now since both users actively set preferences');
          console.log('🔍 SESSION: Duplication details:', {
            hasInitiatorData: hasInitiatorPrefsData,
            hasPartnerData: hasPartnerPrefsData,
            initiatorComplete: data.initiator_preferences_complete,
            partnerComplete: data.partner_preferences_complete,
            hasCompatibilityScore: data.ai_compatibility_score !== null
          });
          // Don't automatically reset - let the flow continue for now
          // Only reset if this is clearly test data pollution
        }
      }

      // Fix initiator flag if inconsistent
      if (data.initiator_preferences_complete && !hasInitiatorPrefsData) {
        console.warn('🔧 SESSION: Initiator flag inconsistent, fixing...');
        updates.initiator_preferences_complete = false;
        needsUpdate = true;
      }

      // Fix partner flag if inconsistent  
      if (data.partner_preferences_complete && !hasPartnerPrefsData) {
        console.warn('🔧 SESSION: Partner flag inconsistent, fixing...');
        updates.partner_preferences_complete = false;
        needsUpdate = true;
      }

      // Recalculate both_preferences_complete (only if no duplication detected)
      if (!updates.hasOwnProperty('both_preferences_complete')) {
        const correctBothComplete = 
          (data.initiator_preferences_complete && hasInitiatorPrefsData) &&
          (data.partner_preferences_complete && hasPartnerPrefsData);

        if (data.both_preferences_complete !== correctBothComplete) {
          console.warn('🔧 SESSION: Both preferences flag inconsistent, fixing...', {
            current: data.both_preferences_complete,
            correct: correctBothComplete
          });
          updates.both_preferences_complete = correctBothComplete;
          needsUpdate = true;
        }
      }

      // Apply fixes if needed
      if (needsUpdate) {
        console.log('🔧 SESSION: Applying consistency fixes:', updates);
        const { error: updateError } = await supabase
          .from('date_planning_sessions')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (updateError) {
          console.error('🔧 SESSION: Failed to apply fixes:', updateError);
        } else {
          // Update local data with fixes
          Object.assign(data, updates);
          console.log('🔧 SESSION: Consistency fixes applied successfully');
        }
      }

      setSession(data);
      console.log('🔧 SESSION: Session set successfully:', data.id);
    } catch (err) {
      console.error('🔧 SESSION: Error fetching session:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch session');
    } finally {
      setLoading(false);
    }
  };

  // Note: Real-time updates are handled by useDatePlanning hook to avoid duplicate subscriptions

  useEffect(() => {
    if (sessionId) {
      fetchSession(sessionId);
    }
  }, [sessionId, user]);

  // Enhanced helper functions with detailed logging
  const isUserInitiator = session ? session.initiator_id === user?.id : false;
  const isUserPartner = session ? session.partner_id === user?.id : false;
  
  // Key fix: Ensure we have proper user identification before checking preferences
  const hasUserSetPreferences = (() => {
    if (!session || !user?.id) return false;
    
    const isInitiator = session.initiator_id === user.id;
    const isPartner = session.partner_id === user.id;
    
    if (!isInitiator && !isPartner) {
      console.warn('🔧 SESSION: User is neither initiator nor partner!', {
        userId: user.id,
        initiatorId: session.initiator_id,
        partnerId: session.partner_id
      });
      return false;
    }
    
    const userPrefsComplete = isInitiator 
      ? session.initiator_preferences_complete 
      : session.partner_preferences_complete;
      
    console.log('🔧 SESSION: User preferences check:', {
      userId: user.id,
      isInitiator,
      isPartner,
      userPrefsComplete,
      initiatorComplete: session.initiator_preferences_complete,
      partnerComplete: session.partner_preferences_complete
    });
    
    return userPrefsComplete;
  })();
  
  const hasPartnerSetPreferences = (() => {
    if (!session || !user?.id) return false;
    
    const isInitiator = session.initiator_id === user.id;
    const partnerPrefsComplete = isInitiator 
      ? session.partner_preferences_complete 
      : session.initiator_preferences_complete;
      
    console.log('🔧 SESSION: Partner preferences check:', {
      partnerPrefsComplete,
      isUserInitiator: isInitiator
    });
    
    return partnerPrefsComplete;
  })();
  
  const canShowResults = session?.both_preferences_complete || false;

  // Debug logging for state synchronization
  console.log('🔧 COLLABORATIVE SESSION DEBUG:', {
    sessionId: session?.id,
    userId: user?.id,
    isUserInitiator,
    isUserPartner,
    initiatorPrefsComplete: session?.initiator_preferences_complete,
    partnerPrefsComplete: session?.partner_preferences_complete,
    bothPrefsComplete: session?.both_preferences_complete,
    hasUserSetPreferences,
    hasPartnerSetPreferences,
    canShowResults,
    databaseFlags: {
      initiator_preferences_complete: session?.initiator_preferences_complete,
      partner_preferences_complete: session?.partner_preferences_complete,
      both_preferences_complete: session?.both_preferences_complete
    }
  });

  // Force refresh function for debugging
  const forceRefreshSession = async () => {
    if (!sessionId) return;
    console.log('🔧 SESSION: Force refreshing session data...');
    await fetchSession(sessionId, true);
  };

  return {
    session,
    loading,
    error,
    isUserInitiator,
    isUserPartner,
    hasUserSetPreferences,
    hasPartnerSetPreferences,
    canShowResults,
    refetchSession: () => sessionId ? fetchSession(sessionId) : Promise.resolve(),
    forceRefreshSession
  };
};