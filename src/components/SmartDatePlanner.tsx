
import React, { useMemo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useBreakpoint } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { ErrorBoundaryWrapper } from '@/components/ErrorBoundary';

import PlanTogether from '@/components/date-planning/PlanTogether';
import InvitationCreation from '@/components/date-planning/InvitationCreation';
import PlanningHeader from '@/components/date-planning/PlanningHeader';
import PreferencesStep from '@/components/date-planning/PreferencesStep';
import PartnerSelection from '@/components/date-planning/PartnerSelection';
import DateModeSelection from '@/components/date-planning/DateModeSelection';

import { useSmartDatePlannerState } from '@/hooks/useSmartDatePlannerState';
import { createSmartDatePlannerHandlers } from '@/components/smart-date-planner/SmartDatePlannerHandlers';
import SmartDatePlannerError from '@/components/smart-date-planner/SmartDatePlannerError';
import SmartDatePlannerAuth from '@/components/smart-date-planner/SmartDatePlannerAuth';
import LocationDisplay from '@/components/smart-date-planner/LocationDisplay';
import { useCollaborativeSession } from '@/hooks/useCollaborativeSession';
import { useFriends } from '@/hooks/useFriends';
import { useGroupDatePlanning } from '@/hooks/useGroupDatePlanning';
import { supabase } from '@/integrations/supabase/client';

interface SmartDatePlannerProps {
  sessionId: string;
  fromProposal: boolean;
  preselectedFriend?: { id: string; name: string } | null;
}

const SmartDatePlanner: React.FC<SmartDatePlannerProps> = ({ sessionId, fromProposal, preselectedFriend = null }) => {
  const { isMobile, isDesktop } = useBreakpoint();
  const { t } = useTranslation();
  const { friends: allFriends } = useFriends();
  const groupPlanning = useGroupDatePlanning();

  const {
    session: collaborativeSession,
    isUserInitiator,
    loading: sessionLoading,
    hasUserSetPreferences,
    hasPartnerSetPreferences,
    canShowResults,
    triggerAIAnalysisManually,
  } = useCollaborativeSession(sessionId);

  const sessionPartner = useMemo(() => {
    if (!collaborativeSession || !allFriends.length) return null;
    const partnerId = isUserInitiator ? collaborativeSession.partner_id : collaborativeSession.initiator_id;
    const partner = allFriends.find(f => f.id === partnerId);
    return partner ? { id: partner.id, name: partner.name } : null;
  }, [collaborativeSession, allFriends, isUserInitiator]);

  const effectivePreselectedFriend = sessionPartner ?? preselectedFriend;

  const state = useSmartDatePlannerState({
    preselectedFriend: effectivePreselectedFriend,
    planningMode: 'collaborative',
    sessionId,
  });

  const handlers = createSmartDatePlannerHandlers({ ...state, collaborativeSession, sessionId });

  // Prefill proposed date/time
  const [proposalDateISO, setProposalDateISO] = useState<string | undefined>();
  useEffect(() => {
    if (!fromProposal || !sessionId) return;
    (async () => {
      try {
        const { data: sd } = await supabase.from('date_planning_sessions').select('initiator_id, partner_id').eq('id', sessionId).single();
        if (!sd) return;
        const { data } = await supabase.from('date_proposals').select('proposed_date')
          .or(`and(proposer_id.eq.${sd.initiator_id},recipient_id.eq.${sd.partner_id}),and(proposer_id.eq.${sd.partner_id},recipient_id.eq.${sd.initiator_id})`)
          .eq('status', 'accepted').order('created_at', { ascending: false }).limit(1);
        const row = Array.isArray(data) ? data?.[0] : (data as any);
        if (row?.proposed_date) setProposalDateISO(row.proposed_date);
      } catch (err) { console.error('Failed to load proposal date:', err); }
    })();
  }, [fromProposal, sessionId]);

  const {
    user, friends, friendsError, datePlanningError, planningStepsError,
    currentSession, loading, compatibilityScore, venueRecommendations,
    currentStep, selectedPartnerId, setCurrentStep, setSelectedPartnerId, getStepProgress, goBack,
    selectedVenueId, invitationMessage, setInvitationMessage, aiAnalyzing,
    selectedPartner, selectedVenue, navigate, userLocation, locationError,
    locationRequested, requestLocation,
    dateMode, setDateMode, handleModeSelect, selectedPartnerIds, setSelectedPartnerIds,
  } = state;

  const handlePartnerContinue = async () => {
    if (dateMode === 'group' && selectedPartnerIds.length > 0) {
      // Create a group date
      const friendNames = selectedPartnerIds.map(id => {
        const f = friends.find(fr => fr.id === id);
        return f?.name || 'Freund';
      });
      const groupName = `Date mit ${friendNames.slice(0, 2).join(', ')}${friendNames.length > 2 ? ` +${friendNames.length - 2}` : ''}`;
      
      const group = await groupPlanning.createGroup(groupName, selectedPartnerIds);
      if (group) {
        // Set first partner as main partner for the preferences step
        setSelectedPartnerId(selectedPartnerIds[0]);
        setCurrentStep('set-preferences');
      }
    } else if (selectedPartnerId) {
      setCurrentStep('set-preferences');
    }
  };

  const { handlePreferencesComplete, handleVenueSelection, handleSendInvitation, handleStartFromScratch, handleManualContinue } = handlers;

  // Session recovery
  useEffect(() => {
    if (!collaborativeSession || !state.user || sessionLoading) return;
    if (collaborativeSession.both_preferences_complete && !collaborativeSession.ai_compatibility_score && state.currentStep === 'set-preferences' && state.userLocation && triggerAIAnalysisManually) {
      setTimeout(() => triggerAIAnalysisManually(state.userLocation), 1000);
    }
  }, [collaborativeSession, state.user, sessionLoading, state.currentStep, state.userLocation, triggerAIAnalysisManually]);

  // Render invitation step
  const renderInvitationStep = () => {
    const venue = selectedVenue || (selectedVenueId ? venueRecommendations?.find(v => v.venue_id === selectedVenueId) : null);
    if (!venue) {
      return (
        <div className="text-center p-6 text-destructive bg-destructive/10 rounded-lg">
          <h3 className="font-semibold mb-2">{t('datePlanning.noVenueSelected')}</h3>
          <p className="mb-4">{t('datePlanning.noVenueHint')}</p>
          <Button onClick={() => setCurrentStep('plan-together')} variant="outline">{t('datePlanning.backToVenues')}</Button>
        </div>
      );
    }
    return (
      <InvitationCreation
        partnerName={selectedPartner?.name || ''}
        selectedVenue={venue}
        invitationMessage={invitationMessage}
        loading={loading}
        onMessageChange={setInvitationMessage}
        onSendInvitation={handleSendInvitation}
      />
    );
  };

  if (friendsError || datePlanningError || planningStepsError) {
    return <SmartDatePlannerError friendsError={friendsError} datePlanningError={datePlanningError} planningStepsError={planningStepsError} onBackToHome={() => navigate('/home')} />;
  }

  if (!user) {
    return <SmartDatePlannerAuth onSignIn={() => navigate('/?auth=required')} />;
  }

  const preferencesStepContent = (
    <PreferencesStep
      sessionId={collaborativeSession?.id || currentSession?.id || sessionId || ''}
      partnerId={effectivePreselectedFriend?.id || selectedPartnerId}
      partnerName={effectivePreselectedFriend?.name || selectedPartner?.name || ''}
      compatibilityScore={compatibilityScore}
      aiAnalyzing={aiAnalyzing}
      onPreferencesComplete={(prefs) => handlePreferencesComplete(prefs, collaborativeSession?.id || sessionId)}
      initialProposedDate={proposalDateISO}
      planningMode="collaborative"
      collaborativeSession={collaborativeSession ? { hasUserSetPreferences, hasPartnerSetPreferences, canShowResults } : undefined}
      onManualContinue={handleManualContinue}
      onDisplayVenues={state.navigateToResults}
      venueRecommendations={venueRecommendations}
    />
  );

  const venueStepContent = selectedPartner && (
    <PlanTogether
      partnerName={selectedPartner.name}
      partnerId={selectedPartnerId}
      venueRecommendations={venueRecommendations || []}
      onVenueSelect={handleVenueSelection}
      error={datePlanningError || undefined}
      onRetrySearch={() => console.log('Retrying venue search...')}
      sessionId={collaborativeSession?.id || currentSession?.id}
      isCollaborative
      compatibilityScore={compatibilityScore}
    />
  );

  return (
    <ErrorBoundaryWrapper silent>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 animate-fade-in">
        <div className={isMobile ? 'max-w-md mx-auto p-6 space-y-8' : 'max-w-6xl mx-auto p-6'}>
          <ErrorBoundaryWrapper silent>
            <PlanningHeader
              progress={getStepProgress()}
              planningMode="collaborative"
              showStartFromScratch={!!effectivePreselectedFriend}
              onStartFromScratch={handleStartFromScratch}
            />
          </ErrorBoundaryWrapper>

          <ErrorBoundaryWrapper silent>
            <LocationDisplay
              userLocation={userLocation}
              locationError={locationError}
              locationRequested={locationRequested}
              onRequestLocation={requestLocation}
            />
          </ErrorBoundaryWrapper>

          <div className={isDesktop ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : 'space-y-6'}>
            <div className="space-y-6">
              {/* Back button */}
              <div className="flex justify-start">
              <Button onClick={() => goBack(effectivePreselectedFriend, navigate)} variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {t('common.back')}
                </Button>
              </div>

              {/* Steps */}
              <ErrorBoundaryWrapper silent>
                <div className="animate-fade-in">
                  {currentStep === 'select-mode' && (
                    <DateModeSelection onSelectMode={handleModeSelect} />
                  )}
                  {currentStep === 'select-partner' && (
                    <PartnerSelection
                      friends={friends}
                      selectedPartnerId={selectedPartnerId}
                      selectedPartnerIds={selectedPartnerIds}
                      dateMode={dateMode === 'group' ? 'group' : 'single'}
                      loading={loading}
                      onPartnerChange={(id) => setSelectedPartnerId(id)}
                      onPartnerIdsChange={setSelectedPartnerIds}
                      onDateModeChange={(m) => setDateMode(m)}
                      onContinue={handlePartnerContinue}
                    />
                  )}
                  {currentStep === 'set-preferences' && preferencesStepContent}
                  {currentStep === 'plan-together' && venueStepContent}
                  {currentStep === 'create-invitation' && selectedPartner && renderInvitationStep()}
                </div>
              </ErrorBoundaryWrapper>
            </div>

            {/* Desktop sidebar */}
            {isDesktop && (
              <div className="space-y-4">
                {dateMode === 'group' && groupPlanning.currentGroup && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h3 className="font-semibold text-foreground mb-2">Gruppe</h3>
                    <p className="text-sm text-muted-foreground mb-2">{groupPlanning.currentGroup.name}</p>
                    <div className="space-y-1.5">
                      {groupPlanning.groupMembers.map(m => (
                        <div key={m.id} className="flex items-center justify-between text-xs">
                          <span className="text-foreground">{m.profile?.name || 'Unbekannt'}</span>
                          <span className={m.invitation_status === 'accepted' ? 'text-green-500' : m.invitation_status === 'declined' ? 'text-red-500' : 'text-muted-foreground'}>
                            {m.invitation_status === 'accepted' ? '✓' : m.invitation_status === 'declined' ? '✗' : '⏳'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {effectivePreselectedFriend && dateMode !== 'group' && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h3 className="font-semibold text-foreground mb-2">{t('datePlanning.planningWith')}</h3>
                    <p className="text-muted-foreground">{effectivePreselectedFriend.name}</p>
                  </div>
                )}
                {compatibilityScore && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h3 className="font-semibold text-foreground mb-2">{t('datePlanning.compatibility')}</h3>
                    <p className="text-2xl font-bold text-primary">
                      {typeof compatibilityScore === 'object' ? compatibilityScore?.overall_score : compatibilityScore}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundaryWrapper>
  );
};

export default SmartDatePlanner;
