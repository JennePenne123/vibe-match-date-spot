
import { toast } from '@/hooks/use-toast';
import { findVenueInRecommendations } from '@/utils/venueDataHelpers';

export const createSmartDatePlannerHandlers = (state: any) => {
  const {
    selectedPartnerId,
    selectedPartnerIds,
    dateMode,
    setCurrentStep,
    setSelectedPartnerId,
    setSelectedPartnerIds,
    setDateMode,
    getActiveSession,
    createPlanningSession,
    compatibilityScore,
    selectedPartner,
    selectedVenue,
    setSelectedVenueId,
    setInvitationMessage,
    currentSession,
    completePlanningSession,
    navigate,
    currentPreferences,
    setCurrentPreferences,
    updateSessionPreferences,
    collaborativeSession,
    sessionId
  } = state;

  async function handlePartnerSelection(partnerId?: string) {
    if (dateMode === 'single') {
      const partnerIdToUse = partnerId || selectedPartnerId;
      if (!partnerIdToUse) return;

      console.log('SmartDatePlanner - Handling single partner selection:', partnerIdToUse);
      
      try {
        const session = await getActiveSession(partnerIdToUse);
        if (!session) {
          console.log('SmartDatePlanner - Creating new planning session');
          await createPlanningSession(partnerIdToUse);
        }
        setCurrentStep('set-preferences');
      } catch (error) {
        console.error('SmartDatePlanner - Error in partner selection:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to select partner. Please try again.'
        });
      }
    } else {
      // Group mode
      if (selectedPartnerIds.length === 0) return;

      console.log('SmartDatePlanner - Handling group selection:', selectedPartnerIds);
      
      try {
        const primaryPartnerId = selectedPartnerIds[0];
        const session = await getActiveSession(primaryPartnerId);
        
        if (!session) {
          console.log('SmartDatePlanner - Creating new group planning session');
          await createPlanningSession(primaryPartnerId, selectedPartnerIds);
        }
        setCurrentStep('set-preferences');
      } catch (error) {
        console.error('SmartDatePlanner - Error in group selection:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to select group. Please try again.'
        });
      }
    }
  }

  async function handlePreferencesComplete(preferences: any, sessionId?: string, freshLocation?: { latitude: number; longitude: number; address?: string }) {
    console.log('🔧 PREFERENCES COMPLETE - Function called with:', {
      preferences: preferences ? 'provided' : 'missing',
      sessionId: sessionId || 'from-state',
      currentStep: state.currentStep,
      collaborativeSessionExists: !!state.collaborativeSession,
      currentSessionExists: !!currentSession
    });
    
    // Store preferences for later use when completing session
    setCurrentPreferences(preferences);
    
    const effectiveSessionId = sessionId || currentSession?.id;
    
    // First, save preferences to the session to trigger completion flags
    if (effectiveSessionId) {
      try {
        console.log('🔧 PREFERENCES COMPLETE - Updating session preferences for session:', effectiveSessionId);
        await updateSessionPreferences(effectiveSessionId, preferences);
        console.log('🔧 PREFERENCES COMPLETE - Session preferences updated successfully');
      } catch (error) {
        console.error('🔧 PREFERENCES COMPLETE - Error updating session preferences:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save preferences. Please try again.'
        });
        return;
      }
    }
    
    // Check if we're in collaborative mode and need to wait for partner
    if (state.planningMode === 'collaborative') {
      // Refresh collaborative session to get latest state after preference update
      if (state.forceRefreshSession) {
        console.log('🔧 PREFERENCES COMPLETE - Refreshing collaborative session to get latest state...');
        await state.forceRefreshSession();
      }
      
      // Set up a delayed refresh to pick up venue data after AI analysis completes
      setTimeout(async () => {
        console.log('🔄 PREFERENCES COMPLETE - Delayed refresh to pick up venue data...');
        if (state.forceRefreshSession) {
          await state.forceRefreshSession();
          
          // Check if venues were loaded, if not try one more time after another delay
          setTimeout(async () => {
            console.log('🔄 PREFERENCES COMPLETE - Final retry for venue data...');
            if (state.forceRefreshSession) {
              await state.forceRefreshSession();
            }
          }, 2000);
        }
      }, 3000); // Wait 3 seconds for AI analysis to complete and store venues
      
      // Check if both users have completed preferences
      const bothComplete = currentSession?.both_preferences_complete || state.collaborativeSession?.canShowResults;
      
      console.log('🔧 PREFERENCES COMPLETE - Both complete check:', {
        bothComplete,
        currentSessionBothComplete: currentSession?.both_preferences_complete,
        collaborativeSessionCanShow: state.collaborativeSession?.canShowResults,
        collaborativeSessionData: state.collaborativeSession ? {
          id: state.collaborativeSession.id,
          bothPreferencesComplete: state.collaborativeSession.both_preferences_complete,
          initiatorPrefsComplete: state.collaborativeSession.initiator_preferences_complete,
          partnerPrefsComplete: state.collaborativeSession.partner_preferences_complete
        } : null
      });
      
      if (!bothComplete) {
        console.log('🔧 PREFERENCES COMPLETE - Not all preferences complete yet, staying on preferences step...');
        return;
      }
      
      console.log('🔧 PREFERENCES COMPLETE - Both partners have set preferences, proceeding with AI analysis...');
    }
    
    // Use fresh location if provided, otherwise fall back to state
    const locationToUse = freshLocation || state.userLocation;
    
    // Run AI analysis only if we have all required data and (solo mode OR both partners have set preferences)
    if (effectiveSessionId && selectedPartnerId && locationToUse) {
      console.log('🚀 PREFERENCES COMPLETE - Starting AI analysis with:', {
        sessionId: effectiveSessionId,
        partnerId: selectedPartnerId,
        preferences: preferences ? 'provided' : 'missing',
        userLocation: locationToUse ? 'provided' : 'missing',
        locationSource: freshLocation ? 'fresh' : 'state',
        hasAnalyzeFunction: typeof state.analyzeCompatibilityAndVenues === 'function'
      });
      
      try {
        const analysisPromise = state.analyzeCompatibilityAndVenues(
          effectiveSessionId,
          selectedPartnerId,
          preferences,
          locationToUse
        );
        
        console.log('🔄 PREFERENCES COMPLETE - Analysis promise created:', !!analysisPromise);
        
        const analysisResult = await analysisPromise;
        
        console.log('✅ PREFERENCES COMPLETE - AI analysis completed successfully', analysisResult);
        console.log('✅ PREFERENCES COMPLETE - Venue recommendations available:', state.venueRecommendations?.length || 0);
        
        // Skip match review and go directly to plan-together
        console.log('🎯 PREFERENCES COMPLETE - Skipping match review, going directly to plan-together');
        setCurrentStep('plan-together');
        
        // Add debugging to verify state after transition
        setTimeout(() => {
          console.log('🔍 PREFERENCES COMPLETE - Post-transition state check:', {
            currentStep: state.currentStep,
            venueCount: state.venueRecommendations?.length || 0,
            hasVenues: (state.venueRecommendations?.length || 0) > 0,
            compatibilityScore: state.compatibilityScore
          });
        }, 100);
      } catch (analysisError) {
        console.error('❌ PREFERENCES COMPLETE - AI analysis error:', analysisError);
        toast({
          variant: 'destructive',
          title: 'AI Analysis Failed',
          description: `Unable to analyze compatibility: ${analysisError.message || 'Unknown error'}`
        });
      }
    } else {
      console.error('🔧 PREFERENCES COMPLETE - Missing required data for AI analysis:', {
        hasSession: !!effectiveSessionId,
        hasPartnerId: !!selectedPartnerId,
        hasLocation: !!locationToUse,
        hasStateLocation: !!state.userLocation,
        hasFreshLocation: !!freshLocation,
        effectiveSessionId,
        selectedPartnerId,
        locationData: locationToUse
      });
      
      const missingItems = [];
      if (!effectiveSessionId) missingItems.push('Session');
      if (!selectedPartnerId) missingItems.push('Partner');
      if (!locationToUse) missingItems.push('Standort');
      
      toast({
        variant: 'destructive',
        title: 'Fehlende Informationen',
        description: missingItems.includes('Standort')
          ? 'Bitte aktiviere deinen Standort oder gib eine Adresse ein.'
          : `Fehlende Daten: ${missingItems.join(', ')}. Bitte versuche es erneut.`
      });
    }
  }

  function handleVenueSelection(venueId: string) {
    console.log('🎯 VENUE SELECTION - Venue selected:', venueId);
    
    if (!venueId) {
      console.error('🎯 VENUE SELECTION - ERROR: No venue ID provided');
      toast({
        variant: 'destructive',
        title: 'Selection Error',
        description: 'Unable to select venue. Please try again.'
      });
      return;
    }
    
    // Validate that venue exists in current recommendations using helper
    const venue = findVenueInRecommendations(venueId, state.venueRecommendations || []);
    
    if (!venue) {
      console.error('🎯 VENUE SELECTION - ERROR: Venue not found in current recommendations:', {
        venueId,
        availableVenues: state.venueRecommendations?.map(v => ({id: v.venue_id, name: v.venue_name})).slice(0, 3),
        totalVenues: state.venueRecommendations?.length || 0
      });
      toast({
        variant: 'destructive',
        title: 'Venue Not Available',
        description: 'This venue is no longer available. Please select another venue.'
      });
      return;
    }
    
    // Set selected venue ID immediately
    setSelectedVenueId(venueId);
    console.log('🎯 VENUE SELECTION - setSelectedVenueId called with:', venueId);
    console.log('🎯 VENUE SELECTION - Found venue for message:', venue?.venue_name);
    
    if (selectedPartner && venue) {
      // Extract percentage from compatibility score object
      const scorePercentage = typeof compatibilityScore === 'object' && compatibilityScore?.overall_score 
        ? Math.round(compatibilityScore.overall_score * 100)
        : typeof compatibilityScore === 'number' 
          ? Math.round(compatibilityScore * 100)
          : 75; // fallback
      
      const aiMessage = `Hi ${selectedPartner.name}! 🌟 Our AI compatibility score is ${scorePercentage}% - we're a great match! I'd love to take you to ${venue.venue_name} based on our shared preferences. ${venue.ai_reasoning} What do you think?`;
      console.log('🎯 VENUE SELECTION - Generated AI message:', aiMessage.substring(0, 100) + '...');
      setInvitationMessage(aiMessage);
    } else {
      console.log('🎯 VENUE SELECTION - Missing data for AI message:', {
        hasPartner: !!selectedPartner,
        hasVenue: !!venue
      });
    }
    
    // Move to next step
    setCurrentStep('create-invitation');
    
    toast({
      title: 'Venue Selected!',
      description: `${venue?.venue_name || 'Venue'} has been selected for your date.`
    });
  }

  async function handleSendInvitation() {
    // Determine the active session (collaborative takes priority)
    const activeSession = collaborativeSession || currentSession;
    const activeSessionId = collaborativeSession?.id || currentSession?.id;
    
    console.log('🚀 SEND INVITATION - Starting process with:', {
      hasCurrentSession: !!currentSession,
      hasCollaborativeSession: !!collaborativeSession,
      activeSessionId,
      selectedVenueId: state.selectedVenueId,
      selectedPartnerId,
      selectedPartner: selectedPartner?.name,
      selectedVenue: selectedVenue?.venue_name,
      invitationMessage: state.invitationMessage?.substring(0, 50) + '...',
      venueRecommendationsCount: state.venueRecommendations?.length || 0,
      planningMode: state.planningMode
    });

    // Validation checks with user feedback
    if (!activeSession || !activeSessionId) {
      console.error('🚀 SEND INVITATION - ERROR: No active session');
      toast({
        variant: 'destructive',
        title: 'Session Error',
        description: 'No active planning session. Please start over.'
      });
      return;
    }
    
    if (!selectedPartnerId) {
      console.error('🚀 SEND INVITATION - ERROR: No partner selected');
      toast({
        variant: 'destructive',
        title: 'Partner Required',
        description: 'Please select a partner for your date.'
      });
      return;
    }

    // Enhanced venue ID resolution with better validation
    let venueIdToUse = state.selectedVenueId;
    let selectedVenueData = null;
    
    console.log('🚀 SEND INVITATION - Venue ID resolution:', {
      selectedVenueId: state.selectedVenueId,
      hasSelectedVenue: !!selectedVenue,
      selectedVenueId_field: selectedVenue?.venue_id,
      selectedVenueIdField: selectedVenue?.id,
      venueRecommendationsCount: state.venueRecommendations?.length || 0,
      firstRecommendation: state.venueRecommendations?.[0]?.venue_id
    });
    
    // First, validate that selected venue exists in current recommendations using helpers
    if (venueIdToUse) {
      const venueInRecommendations = findVenueInRecommendations(venueIdToUse, state.venueRecommendations || []);
      
      if (!venueInRecommendations) {
        console.warn('🚀 SEND INVITATION - Selected venue not in current recommendations, clearing selection');
        venueIdToUse = '';
        selectedVenueData = null;
      } else {
        selectedVenueData = venueInRecommendations;
      }
    }
    
    if (!venueIdToUse && selectedVenue) {
      console.log('🚀 SEND INVITATION - Using venue ID from selectedVenue object');
      venueIdToUse = selectedVenue.venue_id || selectedVenue.id;
      selectedVenueData = selectedVenue;
    }
    
    if (!venueIdToUse && state.venueRecommendations?.length > 0) {
      console.log('🚀 SEND INVITATION - No venue selected, using first recommendation');
      const firstVenue = state.venueRecommendations[0];
      venueIdToUse = firstVenue.venue_id || firstVenue.id;
      selectedVenueData = firstVenue;
      console.log('🚀 SEND INVITATION - Using first venue:', venueIdToUse);
    }
    
    if (!venueIdToUse) {
      console.error('🚀 SEND INVITATION - ERROR: No venue ID available after all fallbacks');
      toast({
        variant: 'destructive',
        title: 'Venue Required',
        description: 'Please select a venue for your date invitation.'
      });
      return;
    }
    
    // Final validation: ensure venue exists in recommendations using helper
    const finalVenueCheck = findVenueInRecommendations(venueIdToUse, state.venueRecommendations || []);
    
    if (!finalVenueCheck) {
      console.error('🚀 SEND INVITATION - ERROR: Final venue validation failed:', {
        venueId: venueIdToUse,
        availableVenues: state.venueRecommendations?.map(v => v.venue_id).slice(0, 3),
        totalVenues: state.venueRecommendations?.length || 0
      });
      toast({
        variant: 'destructive',
        title: 'Venue Validation Failed',
        description: 'Selected venue is not available. Please select a venue from the current recommendations.'
      });
      return;
    }

    // Validate that we have a proper message
    if (!state.invitationMessage || state.invitationMessage.trim().length < 10) {
      console.error('🚀 SEND INVITATION - ERROR: Invalid invitation message');
      toast({
        variant: 'destructive',
        title: 'Message Required',
        description: 'Please add a personalized message to your invitation.'
      });
      return;
    }

    console.log('🚀 SEND INVITATION - All validation passed, calling completePlanningSession with venue ID:', venueIdToUse);
    
    try {
      // Show loading toast
      toast({
        title: 'Sending Invitation...',
        description: 'Your smart date invitation is being prepared.'
      });

      const success = await completePlanningSession(
        activeSessionId,
        venueIdToUse,
        state.invitationMessage,
        currentPreferences
      );

      console.log('🚀 SEND INVITATION - completePlanningSession result:', success);

      if (success) {
        console.log('🚀 SEND INVITATION - SUCCESS! Navigating to home with toast data');
        navigate('/home', { 
          state: { 
            message: 'Smart date invitation sent successfully!',
            toastData: {
              title: 'Invitation Sent! 🚀',
              description: `Your AI-powered date invitation has been sent to ${selectedPartner?.name}! They'll receive a notification and can respond right away.`,
              duration: 6000
            }
          }
        });
      } else {
        console.error('🚀 SEND INVITATION - FAILED: completePlanningSession returned false');
        toast({
          variant: 'destructive',
          title: 'Send Failed',
          description: 'Unable to send invitation. Please try again.'
        });
      }
    } catch (error) {
      console.error('🚀 SEND INVITATION - ERROR during sending:', error);
      toast({
        variant: 'destructive',
        title: 'Send Error',
        description: 'An error occurred while sending the invitation. Please try again.'
      });
    }
  }

  function handleStartFromScratch() {
    console.log('SmartDatePlanner - Starting from scratch');
    setCurrentStep('select-partner');
    setSelectedPartnerId('');
    setSelectedPartnerIds([]);
    setDateMode('single');
    setSelectedVenueId('');
    setInvitationMessage('');
    navigate('/home');
  }

  async function handleManualContinue(freshLocation?: { latitude: number; longitude: number; address?: string }) {
    console.log('🔄 MANUAL TRIGGER - Manual continue triggered');
    
    const effectiveSessionId = collaborativeSession?.id || currentSession?.id || sessionId;
    const locationToUse = freshLocation || state.userLocation;
    
    console.log('🔄 MANUAL TRIGGER - Session resolution:', {
      collaborativeSessionId: collaborativeSession?.id,
      currentSessionId: currentSession?.id,
      urlSessionId: sessionId,
      effectiveSessionId,
      hasPartnerId: !!selectedPartnerId,
      hasLocation: !!locationToUse
    });
    
    if (!effectiveSessionId || !selectedPartnerId || !locationToUse) {
      console.error('❌ MANUAL TRIGGER - Missing required data:', {
        hasSession: !!effectiveSessionId,
        hasPartnerId: !!selectedPartnerId,
        hasLocation: !!locationToUse
      });
      toast({
        variant: 'destructive',
        title: 'Fehlende Informationen',
        description: !locationToUse ? 'Bitte aktiviere deinen Standort oder gib eine Adresse ein.' : 'Session-Daten fehlen. Bitte lade die Seite neu.'
      });
      return;
    }

    try {
      console.log('🚀 MANUAL TRIGGER - Starting AI analysis with session:', effectiveSessionId);
      
      await state.analyzeCompatibilityAndVenues(
        effectiveSessionId,
        selectedPartnerId,
        currentPreferences,
        locationToUse
      );
      
      console.log('✅ MANUAL TRIGGER - AI analysis completed successfully');
      console.log('✅ MANUAL TRIGGER - Venue recommendations:', state.venueRecommendations?.length || 0);
      
      // Ensure step transition happens
      console.log('🎯 MANUAL TRIGGER - FORCING step transition to plan-together');
      setCurrentStep('plan-together');
      
      toast({
        title: 'Analysis Complete!',
        description: 'Found perfect venues based on your preferences.'
      });
    } catch (error) {
      console.error('❌ MANUAL TRIGGER - AI analysis error:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: `Unable to analyze compatibility: ${error.message || 'Unknown error'}`
      });
    }
  }

  return {
    handlePartnerSelection,
    handlePreferencesComplete,
    handleVenueSelection,
    handleSendInvitation,
    handleStartFromScratch,
    handleManualContinue,
    handleContinueToPlanning: () => {
      console.log('🚀 CONTINUE TO PLANNING - Button clicked, transitioning from review-matches to plan-together');
      console.log('🚀 CONTINUE TO PLANNING - Current state:', {
        currentStep: state.currentStep,
        venueCount: state.venueRecommendations?.length || 0,
        hasValidVenues: (state.venueRecommendations || []).some(v => v.venue_id && typeof v.venue_id === 'string'),
        compatibilityScore: state.compatibilityScore
      });
      
      setCurrentStep('plan-together');
      
      // Add debugging to verify step transition
      setTimeout(() => {
        console.log('🔍 CONTINUE TO PLANNING - Post-transition check:', {
          newStep: state.currentStep,
          shouldShowPlanTogether: state.currentStep === 'plan-together',
          venueRecommendations: state.venueRecommendations?.length || 0
        });
      }, 100);
    }
  };
};
