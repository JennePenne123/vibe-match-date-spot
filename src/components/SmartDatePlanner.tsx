
import React, { useMemo, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useBreakpoint } from '@/hooks/use-mobile';
import { ErrorBoundaryWrapper } from '@/components/ErrorBoundary';

import PlanTogether from '@/components/date-planning/PlanTogether';
import InvitationCreation from '@/components/date-planning/InvitationCreation';
import PlanningHeader from '@/components/date-planning/PlanningHeader';
import PartnerSelection from '@/components/date-planning/PartnerSelection';
import PreferencesStep from '@/components/date-planning/PreferencesStep';
import MatchReview from '@/components/date-planning/MatchReview';

// Import refactored components and hooks
import { useSmartDatePlannerState } from '@/hooks/useSmartDatePlannerState';
import { createSmartDatePlannerHandlers } from '@/components/smart-date-planner/SmartDatePlannerHandlers';
import SmartDatePlannerError from '@/components/smart-date-planner/SmartDatePlannerError';
import SmartDatePlannerAuth from '@/components/smart-date-planner/SmartDatePlannerAuth';
import LocationDisplay from '@/components/smart-date-planner/LocationDisplay';
import { useCollaborativeSession } from '@/hooks/useCollaborativeSession';
import { useFriends } from '@/hooks/useFriends';
import { supabase } from '@/integrations/supabase/client';

interface SmartDatePlannerProps {
  sessionId: string;
  fromProposal: boolean;
  preselectedFriend?: { id: string; name: string } | null;
}

const SmartDatePlanner: React.FC<SmartDatePlannerProps> = ({ sessionId, fromProposal, preselectedFriend = null }) => {
  const { isMobile, isDesktop } = useBreakpoint();
  const { friends: allFriends } = useFriends();
  
  // First get collaborative session to extract partner info
  const { 
    session: collaborativeSession, 
    isUserInitiator, 
    loading: sessionLoading,
    hasUserSetPreferences,
    hasPartnerSetPreferences,
    canShowResults,
    triggerAIAnalysisManually,
    aiAnalysisTriggered
  } = useCollaborativeSession(sessionId);
  
  // Extract partner information from session when coming from proposal
  const sessionPartner = useMemo(() => {
    if (!collaborativeSession || !allFriends.length) return null;
    
    const partnerId = isUserInitiator 
      ? collaborativeSession.partner_id 
      : collaborativeSession.initiator_id;
    
    const partner = allFriends.find(f => f.id === partnerId);
    return partner ? { id: partner.id, name: partner.name } : null;
  }, [collaborativeSession, allFriends, isUserInitiator]);
  
  // Use session partner as the preselected friend
  const effectivePreselectedFriend = sessionPartner;
  
  const state = useSmartDatePlannerState({ 
    preselectedFriend: effectivePreselectedFriend,
    planningMode: 'collaborative',
    sessionId
  });

  const handlers = createSmartDatePlannerHandlers({
    ...state,
    collaborativeSession,
    sessionId
  });

  // Prefill proposed date/time from linked proposal when coming from a proposal
  const [proposalDateISO, setProposalDateISO] = useState<string | undefined>();
  useEffect(() => {
    const loadProposalDate = async () => {
      if (!fromProposal || !sessionId) return;
      
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('date_planning_sessions')
          .select('initiator_id, partner_id')
          .eq('id', sessionId)
          .single();
        
        if (sessionError) throw sessionError;
        if (!sessionData) return;
        
        const { data, error } = await supabase
          .from('date_proposals')
          .select('proposed_date')
          .or(`and(proposer_id.eq.${sessionData.initiator_id},recipient_id.eq.${sessionData.partner_id}),and(proposer_id.eq.${sessionData.partner_id},recipient_id.eq.${sessionData.initiator_id})`)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (error) throw error;
        
        const row = Array.isArray(data) ? data?.[0] : (data as any);
        if (row?.proposed_date) {
          setProposalDateISO(row.proposed_date);
        }
      } catch (err) {
        console.error('Failed to load proposal date:', err);
      }
    };
    loadProposalDate();
  }, [fromProposal, sessionId]);

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
    setCurrentStep,
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
    handleStartFromScratch,
    handleManualContinue,
    handleContinueToPlanning
  } = handlers;

  // Enhanced Session Recovery Logic with Location
  useEffect(() => {
    if (!collaborativeSession || !state.user || sessionLoading) return;
    
    const shouldAutoTriggerRecovery = 
      collaborativeSession.both_preferences_complete && 
      !collaborativeSession.ai_compatibility_score &&
      state.currentStep === 'set-preferences';
    
    if (shouldAutoTriggerRecovery && state.userLocation && triggerAIAnalysisManually) {
      // Small delay to ensure all state is settled
      setTimeout(() => {
        triggerAIAnalysisManually(state.userLocation);
      }, 1000);
    }
  }, [collaborativeSession, state.user, sessionLoading, state.currentStep, state.userLocation, triggerAIAnalysisManually]);

  // Function to render invitation step without IIFE anti-pattern
  const renderInvitationStep = () => {
    const venueFromState = selectedVenue;
    const venueFromId = selectedVenueId ? venueRecommendations?.find(v => v.venue_id === selectedVenueId) : null;
    const venueToUse = venueFromState || venueFromId;
    
    if (!venueToUse) {
      return (
        <div className="text-center p-6 text-destructive bg-destructive/10 rounded-lg">
          <h3 className="font-semibold mb-2">No Venue Selected</h3>
          <p className="mb-4">Please go back and select a venue for your date invitation.</p>
          <Button 
            onClick={() => {
              console.log('Going back to venue selection...');
            }}
            variant="outline"
          >
            Back to Venue Selection
          </Button>
        </div>
      );
    }
    
    return (
      <InvitationCreation
        partnerName={selectedPartner?.name || ''}
        selectedVenue={venueToUse}
        invitationMessage={invitationMessage}
        loading={loading}
        onMessageChange={setInvitationMessage}
        onSendInvitation={handleSendInvitation}
      />
    );
  };

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
        onSignIn={() => navigate('/?auth=required')}
      />
    );
  }


  return (
    <ErrorBoundaryWrapper silent={true}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 animate-fade-in">
        <div className={isMobile ? "max-w-md mx-auto p-6 space-y-8" : "max-w-6xl mx-auto p-6"}>
          {/* Header */}
          <ErrorBoundaryWrapper silent={true}>
            <PlanningHeader 
              progress={getStepProgress()} 
              planningMode={'collaborative'} 
              showStartFromScratch={!!effectivePreselectedFriend}
              onStartFromScratch={handleStartFromScratch}
            />
          </ErrorBoundaryWrapper>

          {/* Location Display */}
          <ErrorBoundaryWrapper silent={true}>
            <LocationDisplay
              userLocation={userLocation}
              locationError={locationError}
              locationRequested={locationRequested}
              onRequestLocation={requestLocation}
            />
          </ErrorBoundaryWrapper>


        {isDesktop ? (
          // Desktop Layout: Split screen for collaborative planning
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              {/* Navigation */}
              <div className="flex justify-start animate-slide-in-right">
                <Button 
                  onClick={() => goBack(effectivePreselectedFriend, navigate)} 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </div>

              {/* Step Content - Using consistent step names */}
              <ErrorBoundaryWrapper silent={true}>
                {currentStep === 'select-partner' && !effectivePreselectedFriend && (
                  <PartnerSelection
                    friends={friends}
                    selectedPartnerId={selectedPartnerId}
                    selectedPartnerIds={selectedPartnerIds}
                    dateMode={dateMode}
                    loading={loading}
                    onPartnerChange={setSelectedPartnerId}
                    onPartnerIdsChange={setSelectedPartnerIds}
                    onDateModeChange={setDateMode}
                    onContinue={handlePartnerSelection}
                  />
                )}
              </ErrorBoundaryWrapper>

              <ErrorBoundaryWrapper silent={true}>
                {currentStep === 'set-preferences' && (
                <PreferencesStep
                  sessionId={collaborativeSession?.id || currentSession?.id || sessionId || ''}
                  partnerId={effectivePreselectedFriend?.id || selectedPartnerId}
                  partnerName={effectivePreselectedFriend?.name || selectedPartner?.name || ''}
                  compatibilityScore={compatibilityScore}
                  aiAnalyzing={aiAnalyzing}
                  onPreferencesComplete={(preferences) => handlePreferencesComplete(preferences, collaborativeSession?.id || sessionId)}
                  initialProposedDate={proposalDateISO}
                  planningMode={'collaborative'}
                  collaborativeSession={collaborativeSession ? {
                    hasUserSetPreferences,
                    hasPartnerSetPreferences,
                    canShowResults
                  } : undefined}
                  onManualContinue={handleManualContinue}
                  onDisplayVenues={state.navigateToResults}
                  venueRecommendations={venueRecommendations}
                />
                )}
              </ErrorBoundaryWrapper>


              {(currentStep === 'plan-together') && selectedPartner && (
                <PlanTogether
                  partnerName={selectedPartner.name}
                  partnerId={selectedPartnerId}
                  venueRecommendations={venueRecommendations || []}
                  onVenueSelect={handleVenueSelection}
                  error={datePlanningError || undefined}
                  onRetrySearch={() => {
                    // Retry search functionality
                    console.log('Retrying venue search...');
                  }}
                  sessionId={collaborativeSession?.id || currentSession?.id}
                  isCollaborative={true}
                  compatibilityScore={compatibilityScore}
                />
              )}

              {currentStep === 'create-invitation' && selectedPartner && renderInvitationStep()}
            </div>

            {/* Right side content for additional info */}
            <div className="space-y-4">
              {effectivePreselectedFriend && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold text-foreground mb-2">Planning with</h3>
                  <p className="text-muted-foreground">{effectivePreselectedFriend.name}</p>
                </div>
              )}
              
              {compatibilityScore && (
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-semibold text-foreground mb-2">Compatibility</h3>
                  <p className="text-2xl font-bold text-primary">
                    {typeof compatibilityScore === 'object' ? compatibilityScore?.overall_score : compatibilityScore}%
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Mobile Layout: Single column  
          <div className="space-y-6">
            {/* Navigation */}
            <div className="flex justify-start animate-slide-in-right">
              <Button 
                onClick={() => goBack(effectivePreselectedFriend, navigate)} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </div>

            {/* Step Content - Simplified mobile flow */}
            {currentStep === 'select-partner' && !effectivePreselectedFriend && (
              <div className="animate-fade-in">
                <PartnerSelection
                  friends={friends}
                  selectedPartnerId={selectedPartnerId}
                  selectedPartnerIds={selectedPartnerIds}
                  dateMode={'single'}
                  loading={loading}
                  onPartnerChange={setSelectedPartnerId}
                  onPartnerIdsChange={setSelectedPartnerIds}
                  onDateModeChange={setDateMode}
                  onContinue={() => handlePartnerSelection()}
                />
              </div>
            )}

            {currentStep === 'set-preferences' && (
              <div className="animate-fade-in">
                <PreferencesStep
                  sessionId={collaborativeSession?.id || currentSession?.id || sessionId || ''}
                  partnerId={effectivePreselectedFriend?.id || selectedPartnerId}
                  partnerName={effectivePreselectedFriend?.name || selectedPartner?.name || ''}
                  compatibilityScore={compatibilityScore}
                  aiAnalyzing={aiAnalyzing}
                  onPreferencesComplete={(preferences) => handlePreferencesComplete(preferences, collaborativeSession?.id || sessionId)}
                  initialProposedDate={proposalDateISO}
                  planningMode={'collaborative'}
                  collaborativeSession={collaborativeSession ? {
                    hasUserSetPreferences,
                    hasPartnerSetPreferences,
                    canShowResults
                  } : undefined}
                  onManualContinue={handleManualContinue}
                  onDisplayVenues={state.navigateToResults}
                  venueRecommendations={venueRecommendations}
                />
              </div>
            )}

            {currentStep === 'plan-together' && selectedPartner && (
              <div className="animate-fade-in">
                <PlanTogether
                  partnerName={selectedPartner.name}
                  partnerId={selectedPartnerId}
                  venueRecommendations={venueRecommendations || []}
                  onVenueSelect={handleVenueSelection}
                  error={datePlanningError || undefined}
                  onRetrySearch={() => {
                    console.log('Retrying venue search...');
                  }}
                  sessionId={collaborativeSession?.id || currentSession?.id}
                  isCollaborative={true}
                  compatibilityScore={compatibilityScore}
                />
              </div>
            )}

            {currentStep === 'create-invitation' && selectedPartner && (
              <div className="animate-fade-in">
                {renderInvitationStep()}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </ErrorBoundaryWrapper>
  );
};
export default SmartDatePlanner;
