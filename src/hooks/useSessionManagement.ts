
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
  ai_compatibility_score?: number;
  selected_venue_id?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
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
  const createPlanningSession = useCallback(async (partnerId: string, participantIds?: string[], planningMode: 'solo' | 'collaborative' = 'solo') => {
    if (!user) {
      console.error('🚫 SESSION: Cannot create session - no user');
      return null;
    }

    setLoading(true);
    try {
      console.log('🆕 SESSION: Creating planning session for partner:', partnerId, 'participants:', participantIds);
      
      // First check if there's already an active session
      const existingSession = await getActiveSession(partnerId);
      if (existingSession) {
        console.log('♻️ SESSION: Found existing active session:', existingSession.id);
        return existingSession;
      }
      
      const sessionData: any = {
        initiator_id: user.id,
        partner_id: partnerId,
        session_status: 'active',
        planning_mode: planningMode
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
          compatibilityScore: data.ai_compatibility_score
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
    if (!user || !currentSession) return;

    setLoading(true);
    try {
      console.log('Updating session preferences:', preferences);
      
      const { error: updateError } = await supabase
        .from('date_planning_sessions')
        .update({ 
          preferences_data: preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      // Update local state
      setCurrentSession(prev => prev ? { 
        ...prev, 
        preferences_data: preferences,
        updated_at: new Date().toISOString()
      } : null);
      
    } catch (error) {
      console.error('Error updating preferences:', error);
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

  return {
    currentSession,
    setCurrentSession,
    loading,
    createPlanningSession,
    getActiveSession,
    updateSessionPreferences,
    completePlanningSession
  };
};
