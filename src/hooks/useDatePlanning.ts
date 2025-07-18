
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
    venueSearchError,
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
    console.log('💾 COMPLETE PLANNING SESSION - Starting with:', {
      sessionId,
      venueId,
      hasUser: !!user,
      userId: user?.id,
      hasCurrentSession: !!currentSession,
      currentSessionPartnerId: currentSession?.partner_id,
      messageLength: message?.length || 0,
      compatibilityScore,
      venueRecommendationsCount: venueRecommendations?.length || 0
    });

    if (!user) {
      console.error('💾 COMPLETE PLANNING SESSION - ERROR: No user');
      return false;
    }
    
    if (!currentSession) {
      console.error('💾 COMPLETE PLANNING SESSION - ERROR: No current session');
      return false;
    }

    try {
      console.log('💾 COMPLETE PLANNING SESSION - Step 1: Completing session...');
      // Complete session first
      const sessionCompleted = await completeSession(sessionId, venueId);
      console.log('💾 COMPLETE PLANNING SESSION - Session completion result:', sessionCompleted);
      
      if (!sessionCompleted) {
        console.error('💾 COMPLETE PLANNING SESSION - ERROR: Session completion failed');
        return false;
      }

      console.log('💾 COMPLETE PLANNING SESSION - Step 2: Finding selected venue...');
      // Create the invitation with AI insights
      const selectedVenue = venueRecommendations.find(v => v.venue_id === venueId);
      console.log('💾 COMPLETE PLANNING SESSION - Selected venue:', {
        found: !!selectedVenue,
        venueName: selectedVenue?.venue_name,
        venueId: selectedVenue?.venue_id,
        aiReasoning: selectedVenue?.ai_reasoning?.substring(0, 50) + '...'
      });
      
      console.log('💾 COMPLETE PLANNING SESSION - Step 3: Creating invitation in database...');
      const invitationData = {
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
      };
      
      console.log('💾 COMPLETE PLANNING SESSION - Invitation data to insert:', invitationData);
      
      const { data: insertedInvitation, error: inviteError } = await supabase
        .from('date_invitations')
        .insert(invitationData)
        .select()
        .single();

      if (inviteError) {
        console.error('💾 COMPLETE PLANNING SESSION - DATABASE ERROR:', inviteError);
        throw inviteError;
      }

      console.log('💾 COMPLETE PLANNING SESSION - Invitation created successfully:', insertedInvitation);

      // Reset AI state
      resetAIState();
      
      console.log('💾 COMPLETE PLANNING SESSION - SUCCESS! Planning session and invitation completed successfully');
      return true;
    } catch (error) {
      console.error('💾 COMPLETE PLANNING SESSION - CATCH ERROR:', error);
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
    venueSearchError,
    analyzeCompatibilityAndVenues,
    createPlanningSession,
    updateSessionPreferences: updateSessionPreferencesWithAI,
    getActiveSession,
    completePlanningSession
  };
};
