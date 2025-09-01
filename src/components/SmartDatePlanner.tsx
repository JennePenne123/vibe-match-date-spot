
import React, { useMemo, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useBreakpoint } from '@/hooks/use-mobile';

// Import step components
import PlanningHeader from '@/components/date-planning/PlanningHeader';
import PartnerSelection from '@/components/date-planning/PartnerSelection';
import PreferencesStep from '@/components/date-planning/PreferencesStep';
import MatchReview from '@/components/date-planning/MatchReview';
import InvitationCreation from '@/components/date-planning/InvitationCreation';
import { AIAnalysisDebugPanel } from '@/components/date-planning/AIAnalysisDebugPanel';
import CollapsibleDebugSection from '@/components/debug/CollapsibleDebugSection';

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
  preselectedFriend?: { id: string; name: string } | null;
}

const SmartDatePlanner: React.FC<SmartDatePlannerProps> = ({ preselectedFriend }) => {
  const location = useLocation();
  const { isMobile, isDesktop } = useBreakpoint();
  
  // Get session ID from navigation state (collaborative mode only)
  const sessionId = location.state?.sessionId;
  const fromProposal = location.state?.fromProposal;
  
  // Use collaborative session hook if coming from a proposal
  const { 
    session: collaborativeSession, 
    isUserInitiator, 
    loading: sessionLoading,
    hasUserSetPreferences,
    hasPartnerSetPreferences,
    canShowResults
  } = useCollaborativeSession(
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
    planningMode: 'collaborative' // Force collaborative mode only
  });
  
console.log('🔧 SmartDatePlanner - MAIN RENDER - currentStep:', state.currentStep, 'effectivePreselectedFriend:', !!effectivePreselectedFriend);
  const handlers = createSmartDatePlannerHandlers(state);

  // Prefill proposed date/time from linked proposal when coming from a proposal
  const [proposalDateISO, setProposalDateISO] = useState<string | undefined>();
  useEffect(() => {
    const loadProposalDate = async () => {
      if (!fromProposal || !sessionId) return;
      try {
        const { data, error } = await supabase
          .from('date_proposals')
          .select('proposed_date')
          .eq('planning_session_id', sessionId)
          .limit(1);
        if (error) throw error;
        const row = Array.isArray(data) ? data?.[0] : (data as any);
        if (row?.proposed_date) setProposalDateISO(row.proposed_date);
      } catch (err) {
        console.error('Failed to load proposal proposed_date:', err);
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 animate-fade-in">
      <div className={isMobile ? "max-w-md mx-auto p-6 space-y-8" : "max-w-6xl mx-auto p-6"}>
        {/* Header */}
        {(() => {
          const progressValue = getStepProgress();
          console.log('🔍 SmartDatePlanner progress value:', progressValue, 'currentStep:', currentStep);
          return <PlanningHeader progress={progressValue} planningMode={'collaborative'} />;
        })()}

        {/* Location Display */}
        <LocationDisplay 
          userLocation={userLocation}
          locationError={locationError}
          locationRequested={locationRequested}
          onRequestLocation={requestLocation}
        />

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


              {/* Step Content */}
              {currentStep === 'partner' && (
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

              {currentStep === 'preferences' && (
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
                />
              )}

              {currentStep === 'match' && selectedPartner && (
                <MatchReview
                  compatibilityScore={compatibilityScore || 0}
                  partnerName={selectedPartner.name}
                  partnerId={selectedPartnerId}
                  venueRecommendations={venueRecommendations || []}
                  onVenueSelect={handleVenueSelection}
                  error={datePlanningError || undefined}
                  onRetrySearch={() => {
                    // Retry search functionality
                    console.log('Retrying venue search...');
                  }}
                  sessionId={currentSession?.id}
                  isCollaborative={true}
                  hasPartnerSetPreferences={currentSession?.partner_preferences_complete || false}
                  isWaitingForPartner={!currentSession?.both_preferences_complete}
                />
              )}

              {currentStep === 'invitation' && selectedPartner && selectedVenue && (
                <InvitationCreation
                  partnerName={selectedPartner.name}
                  selectedVenue={selectedVenue}
                  invitationMessage={invitationMessage}
                  loading={loading}
                  onMessageChange={setInvitationMessage}
                  onSendInvitation={handleSendInvitation}
                />
              )}
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
                  <p className="text-2xl font-bold text-primary">{compatibilityScore}%</p>
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

            {/* Step Content - Original mobile flow */}
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

            {(currentStep === 'set-preferences' || effectivePreselectedFriend) && (
              effectivePreselectedFriend || (currentSession && selectedPartner)
            ) && (
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
                />
              </div>
            )}

            {currentStep === 'review-matches' && selectedPartner && (
              <div className="animate-fade-in">
                <MatchReview
                  compatibilityScore={compatibilityScore || 0}
                  partnerName={selectedPartner.name}
                  partnerId={selectedPartnerId}
                  venueRecommendations={venueRecommendations || []}
                  onVenueSelect={handleVenueSelection}
                  error={datePlanningError || undefined}
                  onRetrySearch={() => {
                    console.log('Retrying venue search...');
                  }}
                  sessionId={currentSession?.id}
                  isCollaborative={true}
                  hasPartnerSetPreferences={currentSession?.partner_preferences_complete || false}
                  isWaitingForPartner={!currentSession?.both_preferences_complete}
                />
              </div>
            )}

            {currentStep === 'create-invitation' && selectedPartner && (() => {
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
                        // Go back to venue selection
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
                <div className="animate-fade-in">
                  <InvitationCreation
                    partnerName={selectedPartner.name}
                    selectedVenue={venueToUse}
                    invitationMessage={invitationMessage}
                    loading={loading}
                    onMessageChange={setInvitationMessage}
                    onSendInvitation={handleSendInvitation}
                  />
                </div>
              );
            })()}
          </div>
        )}

        {/* Debug Panel - Show when needed */}
        <CollapsibleDebugSection title="AI Analysis Debug" defaultOpen={false}>
          <AIAnalysisDebugPanel
            sessionId={sessionId}
            partnerId={selectedPartnerId || selectedPartnerIds[0]}
            currentStep={currentStep}
            sessionData={collaborativeSession}
            userLocation={userLocation}
            onAnalysisComplete={() => {
              window.location.reload();
            }}
          />
        </CollapsibleDebugSection>

        {/* Start from Scratch option */}
        {effectivePreselectedFriend && (
          <div className="text-center pt-4 border-t border-border">
            <Button 
              onClick={handleStartFromScratch}
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-foreground"
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
