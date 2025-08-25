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

// Import unified hooks and components
import { useUnifiedDatePlanning } from '@/hooks/useUnifiedDatePlanning';
import { createUnifiedPlannerHandlers } from '@/components/smart-date-planner/UnifiedPlannerHandlers';
import SmartDatePlannerError from '@/components/smart-date-planner/SmartDatePlannerError';
import SmartDatePlannerAuth from '@/components/smart-date-planner/SmartDatePlannerAuth';
import LocationDisplay from '@/components/smart-date-planner/LocationDisplay';
import EnhancedCollaborativeWaiting from '@/components/smart-date-planner/EnhancedCollaborativeWaiting';

interface SmartDatePlannerV2Props {
  preselectedFriend?: { id: string; name: string } | null;
}

const SmartDatePlannerV2: React.FC<SmartDatePlannerV2Props> = ({ preselectedFriend }) => {
  const location = useLocation();
  
  // Get planning mode and session from navigation state
  const planningMode = location.state?.planningMode || 'solo';
  const sessionId = location.state?.sessionId;
  const fromProposal = location.state?.fromProposal;
  
  const state = useUnifiedDatePlanning({
    preselectedFriend,
    planningMode: planningMode as 'solo' | 'collaborative',
    sessionId,
    fromProposal
  });

  const handlers = useMemo(() => createUnifiedPlannerHandlers(state), [state]);

  // Show error if any critical hooks failed
  if (state.error) {
    return (
      <SmartDatePlannerError
        friendsError={null}
        datePlanningError={state.error}
        planningStepsError={null}
        onBackToHome={() => state.navigate('/home')}
      />
    );
  }

  if (!state.user) {
    return (
      <SmartDatePlannerAuth
        onSignIn={() => state.navigate('/register-login')}
      />
    );
  }

  const goBack = () => {
    if (state.currentStep === 'select-partner') {
      state.navigate('/home');
    } else {
      const stepOrder = ['select-partner', 'set-preferences', 'review-matches', 'create-invitation'];
      const currentIndex = stepOrder.indexOf(state.currentStep);
      if (currentIndex > 0) {
        state.updateState({ currentStep: stepOrder[currentIndex - 1] as any });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 animate-fade-in">
      <div className="max-w-md mx-auto p-6 space-y-8">
        {/* Header */}
        <PlanningHeader 
          progress={state.getStepProgress()} 
          planningMode={planningMode as 'solo' | 'collaborative'} 
        />

        {/* Location Display */}
        <LocationDisplay 
          userLocation={state.userLocation}
          locationError={state.locationError}
          locationRequested={state.locationRequested}
          onRequestLocation={state.handleLocationRequest}
        />

        {/* Navigation */}
        <div className="flex justify-start animate-slide-in-right">
          <Button 
            onClick={goBack}
            variant="outline" 
            size="sm"
            className="hover-scale transition-all duration-200 hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back
          </Button>
        </div>

        {/* Step 1: Select Partner */}
        {state.currentStep === 'select-partner' && !(state.isCollaborative && preselectedFriend) && (
          <div className="animate-fade-in">
            <PartnerSelection
              friends={state.friends}
              selectedPartnerId={state.selectedPartnerId}
              selectedPartnerIds={state.selectedPartnerIds}
              dateMode={state.isCollaborative ? 'single' : state.dateMode}
              loading={state.loading}
              onPartnerChange={state.setSelectedPartnerId}
              onPartnerIdsChange={state.setSelectedPartnerIds}
              onDateModeChange={state.setDateMode}
              onContinue={() => handlers.handlePartnerSelection()}
            />
          </div>
        )}

        {/* Step 2: Set Preferences or Collaborative Waiting */}
        {(state.currentStep === 'set-preferences' || (state.isCollaborative && preselectedFriend)) && (
          <div className="animate-fade-in">
            {state.isCollaborative && state.hasUserSetPreferences && state.isWaitingForPartner ? (
              <EnhancedCollaborativeWaiting
                partnerName={preselectedFriend?.name || state.selectedPartner?.name || 'Partner'}
                sessionId={state.currentSession?.id || ''}
                hasUserSetPreferences={state.hasUserSetPreferences}
                hasPartnerSetPreferences={state.hasPartnerSetPreferences}
                canShowResults={state.canShowResults}
                isWaitingForPartner={state.isWaitingForPartner}
                onRefresh={() => state.fetchSession?.(state.currentSession?.id || '')}
                compatibilityScore={state.compatibilityScore}
              />
            ) : (
              <PreferencesStep
                sessionId={state.currentSession?.id || sessionId || ''}
                partnerId={preselectedFriend?.id || state.selectedPartnerId}
                partnerName={preselectedFriend?.name || state.selectedPartner?.name || ''}
                compatibilityScore={state.compatibilityScore}
                aiAnalyzing={state.aiAnalyzing}
                onPreferencesComplete={(preferences) => handlers.handlePreferencesComplete(preferences, state.currentSession?.id)}
                planningMode={planningMode}
                collaborativeSession={state.isCollaborative ? {
                  hasUserSetPreferences: state.hasUserSetPreferences,
                  hasPartnerSetPreferences: state.hasPartnerSetPreferences,
                  canShowResults: state.canShowResults
                } : undefined}
              />
            )}
          </div>
        )}

        {/* Step 3: Review Matches */}
        {state.currentStep === 'review-matches' && state.selectedPartner && (
          <div className="animate-fade-in">
            <MatchReview
              compatibilityScore={state.compatibilityScore || 0}
              partnerName={state.selectedPartner.name}
              partnerId={state.selectedPartnerId}
              venueRecommendations={state.venueRecommendations || []}
              onVenueSelect={handlers.handleVenueSelection}
              error={state.venueSearchError || undefined}
              onRetrySearch={handlers.handleRetrySearch}
              sessionId={state.currentSession?.id}
              isCollaborative={state.isCollaborative}
              hasPartnerSetPreferences={state.hasPartnerSetPreferences}
              isWaitingForPartner={state.isWaitingForPartner}
            />
          </div>
        )}

        {/* Step 4: Create Invitation */}
        {state.currentStep === 'create-invitation' && state.selectedPartner && state.selectedVenue && (
          <div className="animate-fade-in">
            <InvitationCreation
              partnerName={state.selectedPartner.name}
              selectedVenue={state.selectedVenue}
              invitationMessage={state.invitationMessage}
              loading={state.loading}
              onMessageChange={state.setInvitationMessage}
              onSendInvitation={handlers.handleSendInvitation}
            />
          </div>
        )}

        {/* Start from Scratch CTA */}
        {state.currentStep !== 'select-partner' && (
          <div className="pt-8 border-t border-border/50 animate-fade-in">
            <Button 
              onClick={handlers.handleStartFromScratch}
              variant="outline"
              className="w-full text-muted-foreground hover:text-foreground hover-scale transition-all duration-200 hover:shadow-sm"
            >
              Start from Scratch
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartDatePlannerV2;