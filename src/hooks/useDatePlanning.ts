
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { getCompatibilityScore } from '@/services/aiMatchingService';
import { getAIVenueRecommendations } from '@/services/aiVenueService';

interface DatePlanningSession {
  id: string;
  initiator_id: string;
  partner_id: string;
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

export const useDatePlanning = () => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  const [currentSession, setCurrentSession] = useState<DatePlanningSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [compatibilityScore, setCompatibilityScore] = useState<number | null>(null);
  const [venueRecommendations, setVenueRecommendations] = useState<any[]>([]);

  // Create a new planning session
  const createPlanningSession = async (partnerId: string) => {
    if (!user) return null;

    setLoading(true);
    try {
      console.log('Creating planning session for partner:', partnerId);
      
      const { data, error } = await supabase
        .from('date_planning_sessions')
        .insert({
          initiator_id: user.id,
          partner_id: partnerId,
          session_status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Planning session created:', data);
      setCurrentSession(data);
      return data;
    } catch (error) {
      console.error('Error creating planning session:', error);
      handleError(error, {
        toastTitle: 'Failed to create planning session',
        toastDescription: 'Please try again'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update session preferences and trigger AI analysis
  const updateSessionPreferences = async (sessionId: string, preferences: DatePreferences) => {
    if (!user || !currentSession) return;

    setLoading(true);
    try {
      console.log('Updating session preferences:', preferences);
      
      // Update session with preferences
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

      console.log('Starting AI analysis...');
      
      // Trigger AI analysis
      await analyzeCompatibilityAndVenues(sessionId, preferences);
      
    } catch (error) {
      console.error('Error updating preferences:', error);
      handleError(error, {
        toastTitle: 'Failed to update preferences',
        toastDescription: 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  // Analyze compatibility and get venue recommendations
  const analyzeCompatibilityAndVenues = async (sessionId: string, preferences: DatePreferences) => {
    if (!currentSession || !user) return;

    try {
      console.log('Analyzing compatibility and venues...');
      
      // Get compatibility score
      const compatibility = await getCompatibilityScore(user.id, currentSession.partner_id);
      
      if (compatibility) {
        console.log('Compatibility score:', compatibility.overall_score);
        setCompatibilityScore(compatibility.overall_score);
        
        // Update session with compatibility score
        await supabase
          .from('date_planning_sessions')
          .update({ 
            ai_compatibility_score: compatibility.overall_score,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        // Update local session state
        setCurrentSession(prev => prev ? {
          ...prev,
          ai_compatibility_score: compatibility.overall_score
        } : null);
      }

      // Get AI venue recommendations
      console.log('Getting venue recommendations...');
      const venues = await getAIVenueRecommendations(user.id, currentSession.partner_id, 10);
      console.log('Venue recommendations:', venues);
      
      setVenueRecommendations(venues);

    } catch (error) {
      console.error('Error in AI analysis:', error);
      handleError(error, {
        toastTitle: 'AI Analysis Error',
        toastDescription: 'Could not complete compatibility analysis'
      });
    }
  };

  // Get active session
  const getActiveSession = async (partnerId: string) => {
    if (!user) return null;

    try {
      console.log('Getting active session for partner:', partnerId);
      
      const { data, error } = await supabase
        .from('date_planning_sessions')
        .select('*')
        .or(`and(initiator_id.eq.${user.id},partner_id.eq.${partnerId}),and(initiator_id.eq.${partnerId},partner_id.eq.${user.id})`)
        .eq('session_status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      console.log('Active session found:', data);
      setCurrentSession(data);
      
      // If session has compatibility score, set it
      if (data?.ai_compatibility_score) {
        setCompatibilityScore(data.ai_compatibility_score);
      }
      
      return data;
    } catch (error) {
      console.error('Error getting active session:', error);
      handleError(error, {
        toastTitle: 'Failed to load planning session',
        toastDescription: 'Please try again'
      });
      return null;
    }
  };

  // Complete planning session and create invitation
  const completePlanningSession = async (sessionId: string, venueId: string, message: string) => {
    if (!user || !currentSession) return false;

    setLoading(true);
    try {
      console.log('Completing planning session...');
      
      // Update session as completed
      await supabase
        .from('date_planning_sessions')
        .update({ 
          session_status: 'completed',
          selected_venue_id: venueId,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      // Create the invitation with AI insights
      const selectedVenue = venueRecommendations.find(v => v.venue_id === venueId);
      
      const { error: inviteError } = await supabase
        .from('date_invitations')
        .insert({
          sender_id: user.id,
          recipient_id: currentSession.partner_id,
          venue_id: venueId,
          title: 'AI-Matched Date Invitation',
          message: message,
          planning_session_id: sessionId,
          ai_compatibility_score: compatibilityScore,
          ai_reasoning: selectedVenue?.ai_reasoning,
          venue_match_factors: selectedVenue?.match_factors,
          status: 'pending'
        });

      if (inviteError) throw inviteError;

      // Reset state
      setCurrentSession(null);
      setVenueRecommendations([]);
      setCompatibilityScore(null);
      
      console.log('Planning session completed successfully');
      return true;
    } catch (error) {
      console.error('Error completing planning session:', error);
      handleError(error, {
        toastTitle: 'Failed to send invitation',
        toastDescription: 'Please try again'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription for session updates
  useEffect(() => {
    if (!currentSession) return;

    console.log('Setting up real-time subscription for session:', currentSession.id);
    
    const channel = supabase
      .channel(`planning-session-${currentSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'date_planning_sessions',
          filter: `id=eq.${currentSession.id}`,
        },
        (payload) => {
          console.log('Planning session updated via realtime:', payload);
          setCurrentSession(payload.new as DatePlanningSession);
          
          // Update compatibility score if changed
          if (payload.new.ai_compatibility_score) {
            setCompatibilityScore(payload.new.ai_compatibility_score);
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Removing real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [currentSession?.id]);

  return {
    currentSession,
    loading,
    compatibilityScore,
    venueRecommendations,
    createPlanningSession,
    updateSessionPreferences,
    getActiveSession,
    completePlanningSession
  };
};
