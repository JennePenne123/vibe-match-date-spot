
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
    setCurrentPreferences
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

  function handlePreferencesComplete(preferences: any, sessionId?: string) {
    console.log('SmartDatePlanner - Preferences submitted', preferences);
    
    // Store preferences for later use when completing session
    setCurrentPreferences(preferences);
    
    const effectiveSessionId = sessionId || currentSession?.id;
    
    // Check if we're in collaborative mode and need to wait for partner
    if (state.planningMode === 'collaborative' && state.collaborativeSession) {
      const { canShowResults } = state.collaborativeSession;
      
      if (!canShowResults) {
        console.log('SmartDatePlanner - Partner has not set preferences yet, waiting...');
        // Just update preferences, don't run AI analysis
        return;
      }
    }
    
    // Run AI analysis only if we have all required data and (solo mode OR both partners have set preferences)
    if (effectiveSessionId && selectedPartnerId && state.userLocation) {
      console.log('SmartDatePlanner - Starting AI analysis with:', {
        sessionId: effectiveSessionId,
        partnerId: selectedPartnerId,
        preferences,
        userLocation: state.userLocation
      });
      
      setAiAnalyzing(true);
      
      state.analyzeCompatibilityAndVenues(
        effectiveSessionId,
        selectedPartnerId,
        preferences,
        state.userLocation
      ).then(() => {
        console.log('SmartDatePlanner - AI analysis completed successfully');
        setAiAnalyzing(false);
      }).catch(error => {
        console.error('SmartDatePlanner - AI analysis error:', error);
        setAiAnalyzing(false);
        toast({
          variant: 'destructive',
          title: 'AI Analysis Failed',
          description: 'Unable to analyze compatibility. Please try again.'
        });
      });
    } else {
      console.error('SmartDatePlanner - Missing required data for AI analysis:', {
        hasSession: !!effectiveSessionId,
        hasPartnerId: !!selectedPartnerId,
        hasLocation: !!state.userLocation
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

  return {
    handlePartnerSelection,
    handlePreferencesComplete,
    handleVenueSelection,
    handleSendInvitation,
    handleStartFromScratch
  };
};
