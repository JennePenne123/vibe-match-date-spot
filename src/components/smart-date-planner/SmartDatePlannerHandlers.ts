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
    console.log('SmartDatePlanner - Venue selected:', venueId);
    setSelectedVenueId(venueId);
    setCurrentStep('create-invitation');
    
    // Generate AI-powered invitation message
    if (selectedPartner && selectedVenue) {
      const aiMessage = `Hi ${selectedPartner.name}! 🌟 Our AI compatibility score is ${compatibilityScore}% - we're a great match! I'd love to take you to ${selectedVenue.venue_name} based on our shared preferences. ${selectedVenue.ai_reasoning} What do you think?`;
      setInvitationMessage(aiMessage);
    }
  }

  async function handleSendInvitation() {
    if (!currentSession || !state.selectedVenueId) return;

    console.log('SmartDatePlanner - Sending invitation');
    
    try {
      const success = await completePlanningSession(
        currentSession.id,
        state.selectedVenueId,
        state.invitationMessage
      );

      if (success) {
        navigate('/home', { 
          state: { message: 'Smart date invitation sent successfully!' }
        });
      }
    } catch (error) {
      console.error('SmartDatePlanner - Error sending invitation:', error);
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