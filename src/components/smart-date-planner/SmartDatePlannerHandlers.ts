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
    console.log('🚀 SEND INVITATION - Starting process with:', {
      hasCurrentSession: !!currentSession,
      currentSessionId: currentSession?.id,
      selectedVenueId: state.selectedVenueId,
      selectedPartnerId,
      selectedPartner: selectedPartner?.name,
      selectedVenue: selectedVenue?.venue_name,
      invitationMessage: state.invitationMessage?.substring(0, 50) + '...'
    });

    if (!currentSession) {
      console.error('🚀 SEND INVITATION - ERROR: No current session');
      return;
    }
    
    if (!state.selectedVenueId) {
      console.error('🚀 SEND INVITATION - ERROR: No venue selected');
      return;
    }
    
    if (!selectedPartnerId) {
      console.error('🚀 SEND INVITATION - ERROR: No partner selected');
      return;
    }

    console.log('🚀 SEND INVITATION - All validation passed, calling completePlanningSession...');
    
    try {
      const success = await completePlanningSession(
        currentSession.id,
        state.selectedVenueId,
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