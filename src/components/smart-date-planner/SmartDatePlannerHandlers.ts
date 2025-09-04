
import { toast } from '@/hooks/use-toast';

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
    setAiAnalyzing,
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

  async function handlePreferencesComplete(preferences: any, sessionId?: string) {
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
      if (state.collaborativeSession && state.collaborativeSession.refetchSession) {
        console.log('🔧 PREFERENCES COMPLETE - Refreshing collaborative session to get latest state...');
        await state.collaborativeSession.refetchSession();
      }
      
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
    
    // Run AI analysis only if we have all required data and (solo mode OR both partners have set preferences)
    if (effectiveSessionId && selectedPartnerId && state.userLocation) {
      console.log('🚀 PREFERENCES COMPLETE - Starting AI analysis with:', {
        sessionId: effectiveSessionId,
        partnerId: selectedPartnerId,
        preferences: preferences ? 'provided' : 'missing',
        userLocation: state.userLocation ? 'provided' : 'missing',
        hasAnalyzeFunction: typeof state.analyzeCompatibilityAndVenues === 'function'
      });
      
      setAiAnalyzing(true);
      
      try {
        const analysisPromise = state.analyzeCompatibilityAndVenues(
          effectiveSessionId,
          selectedPartnerId,
          preferences,
          state.userLocation
        );
        
        console.log('🔄 PREFERENCES COMPLETE - Analysis promise created:', !!analysisPromise);
        
        const analysisResult = await analysisPromise;
        
        console.log('✅ PREFERENCES COMPLETE - AI analysis completed successfully', analysisResult);
        console.log('✅ PREFERENCES COMPLETE - Venue recommendations available:', state.venueRecommendations?.length || 0);
        
        setAiAnalyzing(false);
        
        // Force step transition after AI analysis completes
        console.log('🎯 PREFERENCES COMPLETE - FORCING step transition to review-matches');
        setCurrentStep('review-matches');
        
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
        setAiAnalyzing(false);
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
        hasLocation: !!state.userLocation,
        effectiveSessionId,
        selectedPartnerId,
        locationData: state.userLocation
      });
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please ensure location is enabled and try again.'
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
    
    // Set selected venue ID immediately
    setSelectedVenueId(venueId);
    console.log('🎯 VENUE SELECTION - setSelectedVenueId called with:', venueId);
    
    // Find the venue from recommendations
    const venue = state.venueRecommendations?.find(v => v.venue_id === venueId);
    console.log('🎯 VENUE SELECTION - Found venue for message:', venue?.venue_name);
    
    if (selectedPartner && venue) {
      const aiMessage = `Hi ${selectedPartner.name}! 🌟 Our AI compatibility score is ${compatibilityScore}% - we're a great match! I'd love to take you to ${venue.venue_name} based on our shared preferences. ${venue.ai_reasoning} What do you think?`;
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
    console.log('🚀 SEND INVITATION - Starting process with:', {
      hasCurrentSession: !!currentSession,
      currentSessionId: currentSession?.id,
      selectedVenueId: state.selectedVenueId,
      selectedPartnerId,
      selectedPartner: selectedPartner?.name,
      selectedVenue: selectedVenue?.venue_name,
      invitationMessage: state.invitationMessage?.substring(0, 50) + '...',
      venueRecommendationsCount: state.venueRecommendations?.length || 0
    });

    // Validation checks with user feedback
    if (!currentSession) {
      console.error('🚀 SEND INVITATION - ERROR: No current session');
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

    // Get venue ID with fallback logic
    let venueIdToUse = state.selectedVenueId;
    
    if (!venueIdToUse && selectedVenue) {
      console.log('🚀 SEND INVITATION - Using venue ID from selectedVenue object');
      venueIdToUse = selectedVenue.venue_id;
    }
    
    if (!venueIdToUse && state.venueRecommendations?.length > 0) {
      console.log('🚀 SEND INVITATION - No venue selected, using first recommendation');
      venueIdToUse = state.venueRecommendations[0].venue_id;
      console.log('🚀 SEND INVITATION - Using first venue:', venueIdToUse);
    }
    
    if (!venueIdToUse) {
      console.error('🚀 SEND INVITATION - ERROR: No venue selected');
      toast({
        variant: 'destructive',
        title: 'Venue Required',
        description: 'Please select a venue for your date invitation.'
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
        currentSession.id,
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

  async function handleManualContinue() {
    console.log('🔄 MANUAL TRIGGER - Manual continue triggered');
    
    // Resolve session ID from multiple sources (collaborative session, current session, or URL param)
    const effectiveSessionId = collaborativeSession?.id || currentSession?.id || sessionId;
    
    console.log('🔄 MANUAL TRIGGER - Session resolution:', {
      collaborativeSessionId: collaborativeSession?.id,
      currentSessionId: currentSession?.id,
      urlSessionId: sessionId,
      effectiveSessionId,
      hasPartnerId: !!selectedPartnerId,
      hasLocation: !!state.userLocation
    });
    
    if (!effectiveSessionId || !selectedPartnerId || !state.userLocation) {
      console.error('❌ MANUAL TRIGGER - Missing required data:', {
        hasSession: !!effectiveSessionId,
        hasPartnerId: !!selectedPartnerId,
        hasLocation: !!state.userLocation
      });
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Session or location data missing. Please try refreshing the page.'
      });
      return;
    }

    setAiAnalyzing(true);
    
    try {
      console.log('🚀 MANUAL TRIGGER - Starting AI analysis with session:', effectiveSessionId);
      
      await state.analyzeCompatibilityAndVenues(
        effectiveSessionId,
        selectedPartnerId,
        currentPreferences,
        state.userLocation
      );
      
      console.log('✅ MANUAL TRIGGER - AI analysis completed successfully');
      console.log('✅ MANUAL TRIGGER - Venue recommendations:', state.venueRecommendations?.length || 0);
      
      setAiAnalyzing(false);
      
      // Ensure step transition happens
      console.log('🎯 MANUAL TRIGGER - FORCING step transition to review-matches');
      setCurrentStep('review-matches');
      
      toast({
        title: 'Analysis Complete!',
        description: 'Found perfect venues based on your preferences.'
      });
    } catch (error) {
      console.error('❌ MANUAL TRIGGER - AI analysis error:', error);
      setAiAnalyzing(false);
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
      console.log('🚀 Handler - Continuing from AI analysis to plan together step');
      setCurrentStep('plan-together');
    }
  };
};
