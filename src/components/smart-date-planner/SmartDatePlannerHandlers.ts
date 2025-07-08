export const createSmartDatePlannerHandlers = (state: any) => {
  const {
    selectedPartnerId,
    setCurrentStep,
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
    const partnerIdToUse = partnerId || selectedPartnerId;
    if (!partnerIdToUse) return;

    console.log('SmartDatePlanner - Handling partner selection:', partnerIdToUse);
    
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
  }

  function handlePreferencesComplete() {
    console.log('SmartDatePlanner - Preferences submitted, starting AI analysis...');
    setAiAnalyzing(true);
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

  return {
    handlePartnerSelection,
    handlePreferencesComplete,
    handleVenueSelection,
    handleSendInvitation
  };
};