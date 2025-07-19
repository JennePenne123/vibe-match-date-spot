
import React from 'react';
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

interface SmartDatePlannerProps {
  preselectedFriend?: { id: string; name: string } | null;
}

const SmartDatePlanner: React.FC<SmartDatePlannerProps> = ({ preselectedFriend }) => {
  const state = useSmartDatePlannerState({ preselectedFriend });
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
        <PlanningHeader progress={getStepProgress()} />

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
            onClick={() => goBack(preselectedFriend, navigate)} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Step 1: Select Partner */}
        {currentStep === 'select-partner' && (
          <PartnerSelection
            friends={friends}
            selectedPartnerId={selectedPartnerId}
            selectedPartnerIds={selectedPartnerIds}
            dateMode={dateMode}
            loading={loading}
            onPartnerChange={setSelectedPartnerId}
            onPartnerIdsChange={setSelectedPartnerIds}
            onDateModeChange={setDateMode}
            onContinue={() => handlePartnerSelection()}
          />
        )}

        {/* Step 2: Set Preferences */}
        {currentStep === 'set-preferences' && currentSession && selectedPartner && (
          <PreferencesStep
            sessionId={currentSession.id}
            partnerId={selectedPartnerId}
            partnerName={selectedPartner.name}
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
            venueRecommendations={venueRecommendations || []}
            onVenueSelect={handleVenueSelection}
            error={state.venueSearchError || undefined}
            onRetrySearch={() => state.analyzeCompatibilityAndVenues?.(
              state.currentSession?.id || '',
              state.selectedPartnerId || '',
              {},
              state.userLocation
            )}
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
                  onClick={() => setCurrentStep('review-matches')}
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
