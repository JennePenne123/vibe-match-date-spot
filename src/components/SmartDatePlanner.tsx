
import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Import step components
import PlanningHeader from '@/components/date-planning/PlanningHeader';
import PartnerSelection from '@/components/date-planning/PartnerSelection';
import PreferencesStep from '@/components/date-planning/PreferencesStep';
import MatchReview from '@/components/date-planning/MatchReview';
import InvitationCreation from '@/components/date-planning/InvitationCreation';

// Import refactored components and hooks
import { useSmartDatePlannerState } from '@/hooks/useSmartDatePlannerState';
import { createSmartDatePlannerHandlers } from '@/components/smart-date-planner/SmartDatePlannerHandlers';
import SmartDatePlannerError from '@/components/smart-date-planner/SmartDatePlannerError';
import SmartDatePlannerAuth from '@/components/smart-date-planner/SmartDatePlannerAuth';
import LocationDisplay from '@/components/smart-date-planner/LocationDisplay';
import { useCollaborativeSession } from '@/hooks/useCollaborativeSession';
import { useFriends } from '@/hooks/useFriends';

interface SmartDatePlannerProps {
  preselectedFriend?: { id: string; name: string } | null;
}

const SmartDatePlanner: React.FC<SmartDatePlannerProps> = ({ preselectedFriend }) => {
  const location = useLocation();
  
  // Get planning mode and session from navigation state
  const planningMode = location.state?.planningMode || 'solo';
  const sessionId = location.state?.sessionId;
  const fromProposal = location.state?.fromProposal;
  
  // Use collaborative session hook if coming from a proposal
  const { session: collaborativeSession, isUserInitiator, loading: sessionLoading } = useCollaborativeSession(
    fromProposal ? sessionId : null
  );
  const { friends: allFriends } = useFriends();
  
  // Extract partner information from session when coming from proposal
  const sessionPartner = useMemo(() => {
    if (!collaborativeSession || !allFriends.length) return null;
    
    const partnerId = isUserInitiator 
      ? collaborativeSession.partner_id 
      : collaborativeSession.initiator_id;
    
    const partner = allFriends.find(f => f.id === partnerId);
    return partner ? { id: partner.id, name: partner.name } : null;
  }, [collaborativeSession, allFriends, isUserInitiator]);
  
  // Determine which friend to use (session partner takes priority over preselected)
  const effectivePreselectedFriend = sessionPartner || preselectedFriend;
  
  console.log('SmartDatePlanner - Session data:', {
    fromProposal,
    sessionId,
    hasCollaborativeSession: !!collaborativeSession,
    sessionPartner,
    effectivePreselectedFriend
  });
  
  const state = useSmartDatePlannerState({ 
    preselectedFriend: effectivePreselectedFriend,
    planningMode: planningMode as 'solo' | 'collaborative'
  });
  
  console.log('🔧 SmartDatePlanner - MAIN RENDER - currentStep:', state.currentStep, 'planningMode:', planningMode, 'effectivePreselectedFriend:', !!effectivePreselectedFriend);
  const handlers = createSmartDatePlannerHandlers(state);

  const {
    user,
    friends,
    friendsError,
    datePlanningError,
    planningStepsError,
    currentSession,
    loading,
    compatibilityScore,
    venueRecommendations,
    currentStep,
    selectedPartnerId,
    setSelectedPartnerId,
    getStepProgress,
    goBack,
    selectedVenueId,
    invitationMessage,
    setInvitationMessage,
    aiAnalyzing,
    selectedPartner,
    selectedVenue,
    navigate,
    userLocation,
    locationError,
    locationRequested,
    requestLocation,
    dateMode,
    setDateMode,
    selectedPartnerIds,
    setSelectedPartnerIds
  } = state;

  const {
    handlePartnerSelection,
    handlePreferencesComplete,
    handleVenueSelection,
    handleSendInvitation,
    handleStartFromScratch
  } = handlers;

  // Show error if any critical hooks failed
  if (friendsError || datePlanningError || planningStepsError) {
    console.error('SmartDatePlanner - Critical errors detected:', {
      friendsError,
      datePlanningError,
      planningStepsError
    });
    
    return (
      <SmartDatePlannerError
        friendsError={friendsError}
        datePlanningError={datePlanningError}
        planningStepsError={planningStepsError}
        onBackToHome={() => navigate('/home')}
      />
    );
  }

  if (!user) {
    return (
      <SmartDatePlannerAuth
        onSignIn={() => navigate('/register-login')}
      />
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto p-6 space-y-6">
        {/* Header */}
        <PlanningHeader progress={getStepProgress()} planningMode={planningMode as 'solo' | 'collaborative'} />

        {/* Location Display */}
        <LocationDisplay 
          userLocation={userLocation}
          locationError={locationError}
          locationRequested={locationRequested}
          onRequestLocation={requestLocation}
        />

        {/* Navigation */}
        <div className="flex justify-start">
          <Button 
            onClick={() => goBack(effectivePreselectedFriend, navigate)} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Step 1: Select Partner - Skip for collaborative mode with preselected friend */}
        {currentStep === 'select-partner' && !(planningMode === 'collaborative' && effectivePreselectedFriend) && (
          <>
            {console.log('🔧 RENDERING SELECT PARTNER STEP - currentStep:', currentStep, 'planningMode:', planningMode, 'effectivePreselectedFriend:', !!effectivePreselectedFriend)}
            <PartnerSelection
              friends={friends}
              selectedPartnerId={selectedPartnerId}
              selectedPartnerIds={selectedPartnerIds}
              dateMode={planningMode === 'collaborative' ? 'single' : dateMode}
              loading={loading}
              onPartnerChange={setSelectedPartnerId}
              onPartnerIdsChange={setSelectedPartnerIds}
              onDateModeChange={setDateMode}
              onContinue={() => handlePartnerSelection()}
            />
          </>
        )}

        {/* Step 2: Set Preferences - Show for collaborative mode with preselected friend OR normal flow */}
        {(currentStep === 'set-preferences' || (planningMode === 'collaborative' && effectivePreselectedFriend)) && (
          // For collaborative sessions from proposals, show preferences if we have partner info
          (planningMode === 'collaborative' && effectivePreselectedFriend) || 
          // For other cases, require both session and partner
          (currentSession && selectedPartner)
        ) && (
          <PreferencesStep
            sessionId={currentSession?.id || sessionId || ''}
            partnerId={effectivePreselectedFriend?.id || selectedPartnerId}
            partnerName={effectivePreselectedFriend?.name || selectedPartner?.name || ''}
            compatibilityScore={compatibilityScore}
            aiAnalyzing={aiAnalyzing}
            onPreferencesComplete={handlePreferencesComplete}
          />
        )}

        {/* Step 3: Review Matches */}
        {currentStep === 'review-matches' && selectedPartner && (
          <MatchReview
            compatibilityScore={compatibilityScore || 0}
            partnerName={selectedPartner.name}
            partnerId={selectedPartnerId}
            venueRecommendations={venueRecommendations || []}
            onVenueSelect={handleVenueSelection}
            error={state.venueSearchError || undefined}
            onRetrySearch={() => state.analyzeCompatibilityAndVenues?.(
              state.currentSession?.id || '',
              state.selectedPartnerId || '',
              {},
              state.userLocation
            )}
            sessionId={currentSession?.id}
            isCollaborative={planningMode === 'collaborative'}
            hasPartnerSetPreferences={currentSession?.partner_preferences_complete || false}
            isWaitingForPartner={planningMode === 'collaborative' && !currentSession?.both_preferences_complete}
          />
        )}

        {/* Step 4: Create Invitation */}
        {currentStep === 'create-invitation' && selectedPartner && (() => {
          // Enhanced venue resolution with better debugging
          const venueFromState = selectedVenue;
          const venueFromId = selectedVenueId ? venueRecommendations?.find(v => v.venue_id === selectedVenueId) : null;
          const venueToUse = venueFromState || venueFromId;
          
          console.log('🎯 INVITATION STEP - Enhanced venue resolution:', {
            currentStep,
            hasSelectedPartner: !!selectedPartner,
            selectedVenueId,
            hasSelectedVenue: !!selectedVenue,
            hasVenueRecommendations: !!venueRecommendations?.length,
            venueFromState: venueFromState?.venue_name,
            venueFromId: venueFromId?.venue_name,
            venueToUse: venueToUse?.venue_name,
            allVenueIds: venueRecommendations?.map(v => ({ id: v.venue_id, name: v.venue_name })) || []
          });
          
          if (!venueToUse) {
            console.error('🎯 INVITATION STEP - ERROR: No venue found for invitation creation');
            return (
              <div className="text-center p-6 text-red-600 bg-red-50 rounded-lg">
                <h3 className="font-semibold mb-2">No Venue Selected</h3>
                <p className="mb-4">Please go back and select a venue for your date invitation.</p>
                <Button 
                  onClick={() => state.setCurrentStep('review-matches')}
                  variant="outline"
                >
                  Back to Venue Selection
                </Button>
              </div>
            );
          }
          
          return (
            <InvitationCreation
              partnerName={selectedPartner.name}
              selectedVenue={venueToUse}
              invitationMessage={invitationMessage}
              loading={loading}
              onMessageChange={setInvitationMessage}
              onSendInvitation={handleSendInvitation}
            />
          );
        })()}

        {/* Start from Scratch CTA - Show on all steps except first */}
        {currentStep !== 'select-partner' && (
          <div className="pt-6 border-t border-gray-200">
            <Button 
              onClick={handleStartFromScratch}
              variant="outline"
              className="w-full text-gray-600 hover:text-gray-800"
            >
              Start from Scratch
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartDatePlanner;
