
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface DatePlanningSession {
  id: string;
  initiator_id: string;
  partner_id: string;
  participant_ids?: string[];
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

interface DatePreferences {
  preferred_cuisines?: string[];
  preferred_price_range?: string[];
  preferred_times?: string[];
  preferred_vibes?: string[];
  max_distance?: number;
  dietary_restrictions?: string[];
}

export const useSessionManagement = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [currentSession, setCurrentSession] = useState<DatePlanningSession | null>(null);
  const [loading, setLoading] = useState(false);

  // Create a new planning session
  const createPlanningSession = useCallback(async (partnerId: string, participantIds?: string[], planningMode: 'solo' | 'collaborative' = 'solo', forceNew: boolean = false) => {
    if (!user) {
      console.error('🚫 SESSION: Cannot create session - no user');
      return null;
    }

    setLoading(true);
    try {
      console.log('🆕 SESSION: Creating planning session for partner:', partnerId, 'participants:', participantIds);
      
      // First check if there's already an active session (unless forcing new)
      if (!forceNew) {
        const existingSession = await getActiveSession(partnerId);
        if (existingSession) {
          console.log('♻️ SESSION: Found existing active session:', existingSession.id);
          return existingSession;
        }
      } else {
        console.log('🆕 SESSION: Force creating new session, expiring any existing ones');
        // Expire any existing active sessions when forcing new
        await supabase
          .from('date_planning_sessions')
          .update({ session_status: 'expired', updated_at: new Date().toISOString() })
          .or(`and(initiator_id.eq.${user.id},partner_id.eq.${partnerId}),and(initiator_id.eq.${partnerId},partner_id.eq.${user.id})`)
          .eq('session_status', 'active');
      }
      
      const sessionData: any = {
        initiator_id: user.id,
        partner_id: partnerId,
        session_status: 'active',
        planning_mode: planningMode,
        // Explicitly initialize preference flags to false for new sessions
        initiator_preferences_complete: false,
        partner_preferences_complete: false,
        both_preferences_complete: false
      };

      // Add participant_ids for group planning
      if (participantIds && participantIds.length > 1) {
        sessionData.participant_ids = participantIds;
      }
      
      const { data, error } = await supabase
        .from('date_planning_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;

      console.log('✅ SESSION: Planning session created successfully:', {
        id: data.id,
        initiator: data.initiator_id,
        partner: data.partner_id,
        status: data.session_status
      });
      
      setCurrentSession(data);
      return data;
    } catch (error) {
      console.error('❌ SESSION: Error creating planning session:', error);
      handleError(error, {
        toastTitle: 'Failed to create planning session',
        toastDescription: 'Please try again'
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, handleError]);

  // Get active session
  const getActiveSession = useCallback(async (partnerId: string) => {
    if (!user) {
      console.error('🚫 SESSION: Cannot get session - no user');
      return null;
    }

    try {
      console.log('🔍 SESSION: Getting active session for partner:', partnerId);
      
      const { data, error } = await supabase
        .from('date_planning_sessions')
        .select('*')
        .or(`and(initiator_id.eq.${user.id},partner_id.eq.${partnerId}),and(initiator_id.eq.${partnerId},partner_id.eq.${user.id})`)
        .eq('session_status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        console.log('✅ SESSION: Active session found:', {
          id: data.id,
          status: data.session_status,
          created: data.created_at,
          expires: data.expires_at,
          hasPreferences: !!data.preferences_data,
          compatibilityScore: data.ai_compatibility_score,
          initiator_complete: data.initiator_preferences_complete,
          partner_complete: data.partner_preferences_complete,
          hasInitiatorPrefs: !!data.initiator_preferences,
          hasPartnerPrefs: !!data.partner_preferences
        });
        
        // Check if session is expired
        const now = new Date();
        const expiresAt = new Date(data.expires_at);
        if (now > expiresAt) {
          console.warn('⚠️ SESSION: Session expired, cleaning up');
          await supabase
            .from('date_planning_sessions')
            .update({ session_status: 'expired' })
            .eq('id', data.id);
          setCurrentSession(null);
          return null;
        }

        // Validate preference flags consistency and fix if needed
        const shouldResetFlags = 
          (data.initiator_preferences_complete && !data.initiator_preferences) ||
          (data.partner_preferences_complete && !data.partner_preferences);

        if (shouldResetFlags) {
          console.warn('⚠️ SESSION: Inconsistent preference flags detected, resetting...');
          const resetData: any = { updated_at: new Date().toISOString() };
          
          if (data.initiator_preferences_complete && !data.initiator_preferences) {
            resetData.initiator_preferences_complete = false;
          }
          if (data.partner_preferences_complete && !data.partner_preferences) {
            resetData.partner_preferences_complete = false;
          }
          
          // Always recalculate both_preferences_complete
          resetData.both_preferences_complete = 
            (data.initiator_preferences_complete && !!data.initiator_preferences) &&
            (data.partner_preferences_complete && !!data.partner_preferences);

          const { error: resetError } = await supabase
            .from('date_planning_sessions')
            .update(resetData)
            .eq('id', data.id);

          if (!resetError) {
            // Refetch the updated session data
            const { data: updatedData, error: refetchError } = await supabase
              .from('date_planning_sessions')
              .select('*')
              .eq('id', data.id)
              .single();
            
            if (!refetchError && updatedData) {
              console.log('✅ SESSION: Preference flags reset successfully');
              setCurrentSession(updatedData);
              return updatedData;
            }
          }
        }
      } else {
        console.log('📭 SESSION: No active session found');
      }
      
      setCurrentSession(data);
      return data;
    } catch (error) {
      console.error('❌ SESSION: Error getting active session:', error);
      handleError(error, {
        toastTitle: 'Failed to load planning session',
        toastDescription: 'Please try again'
      });
      return null;
    }
  }, [user, handleError]);

  // Update session preferences
  const updateSessionPreferences = useCallback(async (sessionId: string, preferences: DatePreferences) => {
    if (!user) {
      console.error('🚫 SESSION: Cannot update preferences - no user');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 SESSION: Updating session preferences for user:', user.id, 'session:', sessionId);
      console.log('📋 SESSION: Preferences being set:', JSON.stringify(preferences, null, 2));
      console.log('🔍 SESSION: Current session state:', currentSession?.id);
      
      // First fetch current session to avoid overwriting
      const { data: currentSessionData, error: fetchError } = await supabase
        .from('date_planning_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      // Determine which preference completion flag to update based on fresh session data
      const isInitiator = currentSessionData.initiator_id === user.id;

      console.log('📊 SESSION: Current session data:', {
        id: currentSessionData.id,
        initiator_complete: currentSessionData.initiator_preferences_complete,
        partner_complete: currentSessionData.partner_preferences_complete,
        both_complete: currentSessionData.both_preferences_complete,
        hasInitiatorPrefs: !!currentSessionData.initiator_preferences,
        hasPartnerPrefs: !!currentSessionData.partner_preferences
      });

      // Store preferences in user-specific column and set completion flag
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (isInitiator) {
        updateData.initiator_preferences = preferences;
        updateData.initiator_preferences_complete = true;
        console.log('✅ SESSION: Setting initiator preferences and flag to true');
      } else {
        updateData.partner_preferences = preferences;
        updateData.partner_preferences_complete = true;
        console.log('✅ SESSION: Setting partner preferences and flag to true');
      }
      
      console.log('📤 SESSION: About to update session with data:', JSON.stringify(updateData, null, 2));
      const { error: updateError } = await supabase
        .from('date_planning_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (updateError) throw updateError;

      console.log('🎯 SESSION: Preferences updated successfully');

      // Now calculate and update both_preferences_complete based on current state
      const { data: freshSession, error: fetchError2 } = await supabase
        .from('date_planning_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchError2) throw fetchError2;

      // Calculate both_preferences_complete based on actual data
      const bothComplete = 
        freshSession.initiator_preferences_complete && 
        freshSession.partner_preferences_complete &&
        !!freshSession.initiator_preferences && 
        !!freshSession.partner_preferences;

      console.log('🧮 SESSION: Calculating both_preferences_complete:', {
        initiator_complete: freshSession.initiator_preferences_complete,
        partner_complete: freshSession.partner_preferences_complete,
        has_initiator_prefs: !!freshSession.initiator_preferences,
        has_partner_prefs: !!freshSession.partner_preferences,
        result: bothComplete
      });

      // Update both_preferences_complete if it needs to change
      if (freshSession.both_preferences_complete !== bothComplete) {
        console.log('📝 SESSION: Updating both_preferences_complete to:', bothComplete);
        const { error: bothUpdateError } = await supabase
          .from('date_planning_sessions')
          .update({
            both_preferences_complete: bothComplete,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (bothUpdateError) throw bothUpdateError;
      }

      // Fetch the final updated session
      const { data: updatedSession, error: fetchUpdatedError } = await supabase
        .from('date_planning_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (fetchUpdatedError) throw fetchUpdatedError;

      console.log('📊 SESSION: Updated session data after preferences update:', {
        id: updatedSession.id,
        initiator_complete: updatedSession.initiator_preferences_complete,
        partner_complete: updatedSession.partner_preferences_complete,
        both_complete: updatedSession.both_preferences_complete,
        hasInitiatorPrefs: !!updatedSession.initiator_preferences,
        hasPartnerPrefs: !!updatedSession.partner_preferences
      });

      // Update local state with the fresh session data from database
      setCurrentSession(updatedSession);
      
    } catch (error) {
      console.error('❌ SESSION: Error updating preferences:', error);
      handleError(error, {
        toastTitle: 'Failed to update preferences',
        toastDescription: 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  }, [user, currentSession, handleError]);

  // Complete planning session
  const completePlanningSession = useCallback(async (sessionId: string, venueId: string) => {
    if (!user || !currentSession) return false;

    setLoading(true);
    try {
      console.log('Completing planning session...');
      
      await supabase
        .from('date_planning_sessions')
        .update({ 
          session_status: 'completed',
          selected_venue_id: venueId,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      // Reset state
      setCurrentSession(null);
      
      console.log('Planning session completed successfully');
      return true;
    } catch (error) {
      console.error('Error completing planning session:', error);
      handleError(error, {
        toastTitle: 'Failed to complete session',
        toastDescription: 'Please try again'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, currentSession, handleError]);

  // Reset session to clean state
  const resetSession = useCallback(async (sessionId: string) => {
    if (!user) return false;

    setLoading(true);
    try {
      console.log('🔄 SESSION: Resetting session to clean state:', sessionId);
      
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

      if (error) throw error;

      // Refresh current session data
      const { data: refreshedSession } = await supabase
        .from('date_planning_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (refreshedSession) {
        setCurrentSession(refreshedSession);
      }

      console.log('✅ SESSION: Session reset successfully');
      return true;
    } catch (error) {
      console.error('❌ SESSION: Error resetting session:', error);
      handleError(error, {
        toastTitle: 'Failed to reset session',
        toastDescription: 'Please try again'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, handleError]);

  return {
    currentSession,
    setCurrentSession,
    loading,
    createPlanningSession,
    getActiveSession,
    updateSessionPreferences,
    completePlanningSession,
    resetSession
  };
};
