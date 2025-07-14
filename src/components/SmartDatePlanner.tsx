import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SmartPlannerDebug } from '@/components/debug/SmartPlannerDebug';

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
import { VenueSearchTester } from '@/components/debug/VenueSearchTester';
import { EdgeFunctionTester } from '@/components/debug/EdgeFunctionTester';

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
          <div className="space-y-4">
            {/* Location Requirement Check */}
            {!userLocation && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">📍</span>
                  <div>
                    <h4 className="font-semibold text-yellow-800">Location Required</h4>
                    <p className="text-sm text-yellow-700">
                      Real location access is required for venue recommendations. Please enable location to continue.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Debug Info */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">🔍 Location & Search Status:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Real User Location:</strong> {userLocation ? `✅ ${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : '❌ Required'}</p>
                <p><strong>Venue Search Status:</strong> {userLocation ? 'Ready for Google Places API' : 'Blocked - no location'}</p>
                <p><strong>Compatibility Score:</strong> {compatibilityScore || 'Loading...'}</p>
                <p><strong>Venue Recommendations:</strong> {venueRecommendations?.length || 0} venues</p>
                <p><strong>Partner:</strong> {selectedPartner?.name || 'None'}</p>
              </div>
              {venueRecommendations && venueRecommendations.length > 0 && (
                <div className="mt-2 text-xs text-blue-600">
                  <p><strong>Real Venues:</strong> {venueRecommendations.map(v => v.venue_name).join(', ')}</p>
                </div>
              )}
            </div>
            
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
          </div>
        )}

        {/* Step 4: Create Invitation */}
        {currentStep === 'create-invitation' && selectedPartner && selectedVenue && (
          <InvitationCreation
            partnerName={selectedPartner.name}
            selectedVenue={selectedVenue}
            invitationMessage={invitationMessage}
            loading={loading}
            onMessageChange={setInvitationMessage}
            onSendInvitation={handleSendInvitation}
          />
        )}

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

        {/* Debug Components */}
        <div className="space-y-4 border-t border-gray-200 pt-6">
          <VenueSearchTester />
          <EdgeFunctionTester />
          
          <SmartPlannerDebug
            currentUser={user}
            selectedPartner={selectedPartner}
            currentSession={currentSession}
            compatibilityScore={compatibilityScore}
            venueRecommendations={venueRecommendations}
            currentStep={currentStep}
          />
        </div>
      </div>
    </div>
  );
};

export default SmartDatePlanner;
