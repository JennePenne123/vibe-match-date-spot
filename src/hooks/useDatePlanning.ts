
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useSessionManagement } from '@/hooks/useSessionManagement';
import { useAIAnalysis } from '@/hooks/useAIAnalysis';
import { useSessionRealtime } from '@/hooks/useSessionRealtime';
import { supabase } from '@/integrations/supabase/client';

interface DatePreferences {
  preferred_cuisines?: string[];
  preferred_price_range?: string[];
  preferred_times?: string[];
  preferred_vibes?: string[];
  max_distance?: number;
  dietary_restrictions?: string[];
}

export const useDatePlanning = (userLocation?: { latitude: number; longitude: number; address?: string }) => {
  const { user } = useAuth();
  const { handleError } = useErrorHandler();
  
  // Use focused hooks
  const {
    currentSession,
    setCurrentSession,
    loading,
    createPlanningSession,
    getActiveSession,
    updateSessionPreferences,
    completePlanningSession: completeSession
  } = useSessionManagement();

  const {
    compatibilityScore,
    setCompatibilityScore,
    venueRecommendations,
    setVenueRecommendations,
    analyzeCompatibilityAndVenues,
    resetAIState
  } = useAIAnalysis();

  // Set up real-time subscription
  useSessionRealtime(
    currentSession,
    setCurrentSession,
    setCompatibilityScore
  );

  // Enhanced update session preferences with AI analysis
  const updateSessionPreferencesWithAI = useCallback(async (sessionId: string, preferences: DatePreferences) => {
    if (!currentSession) return;

    console.log('🎯 DATE PLANNING: Starting session preferences update with location:', userLocation);

    // Update preferences first
    await updateSessionPreferences(sessionId, preferences);
    
    // Then trigger AI analysis with user location
    await analyzeCompatibilityAndVenues(sessionId, currentSession.partner_id, preferences, userLocation);
  }, [currentSession, updateSessionPreferences, analyzeCompatibilityAndVenues, userLocation]);

  // Enhanced complete planning session with invitation creation
  const completePlanningSession = useCallback(async (sessionId: string, venueId: string, message: string) => {
    if (!user || !currentSession) return false;

    try {
      // Complete session first
      const sessionCompleted = await completeSession(sessionId, venueId);
      if (!sessionCompleted) return false;

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

      // Reset AI state
      resetAIState();
      
      console.log('Planning session and invitation completed successfully');
      return true;
    } catch (error) {
      console.error('Error completing planning session:', error);
      handleError(error, {
        toastTitle: 'Failed to send invitation',
        toastDescription: 'Please try again'
      });
      return false;
    }
  }, [user, currentSession, completeSession, venueRecommendations, compatibilityScore, resetAIState, handleError]);

  return {
    currentSession,
    loading,
    compatibilityScore,
    venueRecommendations,
    createPlanningSession,
    updateSessionPreferences: updateSessionPreferencesWithAI,
    getActiveSession,
    completePlanningSession
  };
};
