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
    navigate
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
      }
    } else {
      // Group mode
      if (selectedPartnerIds.length === 0) return;

      console.log('SmartDatePlanner - Handling group selection:', selectedPartnerIds);
      
      try {
        // For now, use the first partner as the primary partner
        // and store the rest in participant_ids
        const primaryPartnerId = selectedPartnerIds[0];
        const session = await getActiveSession(primaryPartnerId);
        
        if (!session) {
          console.log('SmartDatePlanner - Creating new group planning session');
          await createPlanningSession(primaryPartnerId, selectedPartnerIds);
        }
        setCurrentStep('set-preferences');
      } catch (error) {
        console.error('SmartDatePlanner - Error in group selection:', error);
      }
    }
  }

  function handlePreferencesComplete(preferences: any) {
    console.log('SmartDatePlanner - Preferences submitted, starting AI analysis...', preferences);
    setAiAnalyzing(true);
    
    if (currentSession && selectedPartnerId && state.userLocation) {
      console.log('SmartDatePlanner - Triggering AI analysis with:', {
        sessionId: currentSession.id,
        partnerId: selectedPartnerId,
        preferences,
        userLocation: state.userLocation
      });
      
      state.analyzeCompatibilityAndVenues(
        currentSession.id,
        selectedPartnerId,
        preferences,
        state.userLocation
      ).catch(error => {
        console.error('SmartDatePlanner - AI analysis error:', error);
        setAiAnalyzing(false);
      });
    } else {
      console.error('SmartDatePlanner - Missing required data for AI analysis:', {
        hasSession: !!currentSession,
        hasPartnerId: !!selectedPartnerId,
        hasLocation: !!state.userLocation
      });
      setAiAnalyzing(false);
    }
  }

  function handleVenueSelection(venueId: string) {
    console.log('🎯 VENUE SELECTION - Venue selected:', venueId);
    setSelectedVenueId(venueId);
    
    // Log the state immediately after setting
    console.log('🎯 VENUE SELECTION - setSelectedVenueId called with:', venueId);
    console.log('🎯 VENUE SELECTION - Current state.selectedVenueId before update:', state.selectedVenueId);
    
    setCurrentStep('create-invitation');
    
    // Generate AI-powered invitation message
    // Need to find the venue from recommendations since selectedVenue might not be updated yet
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
      // Debug: Check all venue-related state
      venueRecommendationsCount: state.venueRecommendations?.length || 0,
      allVenueIds: state.venueRecommendations?.map(v => v.venue_id) || []
    });

    if (!currentSession) {
      console.error('🚀 SEND INVITATION - ERROR: No current session');
      return;
    }
    
    // More robust venue ID check - try to get it from different sources
    let venueIdToUse = state.selectedVenueId;
    
    if (!venueIdToUse && selectedVenue) {
      console.log('🚀 SEND INVITATION - Trying to get venue ID from selectedVenue object');
      venueIdToUse = selectedVenue.venue_id;
    }
    
    if (!venueIdToUse && state.venueRecommendations?.length > 0) {
      console.log('🚀 SEND INVITATION - No venue selected, checking if we should use first recommendation');
      // For debugging - don't auto-select, but show what's available
      console.log('🚀 SEND INVITATION - Available venues:', state.venueRecommendations.map(v => ({
        id: v.venue_id,
        name: v.venue_name
      })));
    }
    
    if (!venueIdToUse) {
      console.error('🚀 SEND INVITATION - ERROR: No venue selected');
      console.error('🚀 SEND INVITATION - Debug info:', {
        selectedVenueId: state.selectedVenueId,
        selectedVenue: selectedVenue,
        hasRecommendations: !!state.venueRecommendations?.length,
        recommendations: state.venueRecommendations?.map(v => v.venue_name)
      });
      return;
    }
    
    if (!selectedPartnerId) {
      console.error('🚀 SEND INVITATION - ERROR: No partner selected');
      return;
    }

    console.log('🚀 SEND INVITATION - All validation passed, calling completePlanningSession with venue ID:', venueIdToUse);
    
    try {
      const success = await completePlanningSession(
        currentSession.id,
        venueIdToUse,
        state.invitationMessage
      );

      console.log('🚀 SEND INVITATION - completePlanningSession result:', success);

      if (success) {
        console.log('🚀 SEND INVITATION - SUCCESS! Navigating to home with toast data');
        // Show success toast with enhanced messaging
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
      }
    } catch (error) {
      console.error('🚀 SEND INVITATION - ERROR during sending:', error);
    }
  }

  function handleStartFromScratch() {
    console.log('SmartDatePlanner - Starting from scratch');
    // Reset all state and navigate back to partner selection
    setCurrentStep('select-partner');
    setSelectedPartnerId('');
    setSelectedPartnerIds([]);
    setDateMode('single');
    setSelectedVenueId('');
    setInvitationMessage('');
    // Navigate to fresh planning session
    navigate('/plan-date');
  }

  return {
    handlePartnerSelection,
    handlePreferencesComplete,
    handleVenueSelection,
    handleSendInvitation,
    handleStartFromScratch
  };
};