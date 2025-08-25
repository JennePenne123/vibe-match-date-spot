import React, { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Import step components
import PlanningHeader from '@/components/date-planning/PlanningHeader';
import PartnerSelection from '@/components/date-planning/PartnerSelection';
import PreferencesStep from '@/components/date-planning/PreferencesStep';
import MatchReview from '@/components/date-planning/MatchReview';
import InvitationCreation from '@/components/date-planning/InvitationCreation';

// Import unified hooks and components
import { useUnifiedDatePlanning } from '@/hooks/useUnifiedDatePlanning';
import SmartDatePlannerError from '@/components/smart-date-planner/SmartDatePlannerError';
import SmartDatePlannerAuth from '@/components/smart-date-planner/SmartDatePlannerAuth';
import LocationDisplay from '@/components/smart-date-planner/LocationDisplay';
import EnhancedCollaborativeWaiting from '@/components/smart-date-planner/EnhancedCollaborativeWaiting';

interface SmartDatePlannerV2Props {
  preselectedFriend?: { id: string; name: string } | null;
}

const SmartDatePlannerV2: React.FC<SmartDatePlannerV2Props> = ({ preselectedFriend }) => {
  const location = useLocation();
  const { toast } = useToast();
  
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

  // Create handlers directly in component using useCallback
  const handlePartnerSelection = useCallback(async (partnerId?: string) => {
    const targetPartnerId = partnerId || state.selectedPartnerId;
    
    if (!targetPartnerId) {
      toast({
        title: 'No partner selected',
        description: 'Please select a friend to plan a date with.',
        variant: 'destructive'
      });
      return;
    }

    console.log('🎯 PARTNER SELECTION:', { targetPartnerId, mode: state.dateMode, isCollaborative: state.isCollaborative });

    try {
      state.updateState({ loading: true });

      if (state.dateMode === 'single' || state.isCollaborative) {
        // Create planning session for single friend or collaborative mode
        const session = await state.createPlanningSession(
          targetPartnerId,
          [state.user.id, targetPartnerId],
          state.isCollaborative ? 'collaborative' : 'solo'
        );
        
        if (session) {
          console.log('✅ Session created, advancing to preferences');
          state.advanceStep();
        }
      } else {
        // Group mode - advance directly to preferences
        state.updateState({ 
          selectedPartnerIds: [targetPartnerId, ...state.selectedPartnerIds].slice(0, 5)
        });
        state.advanceStep();
      }
    } catch (error) {
      console.error('Partner selection failed:', error);
      toast({
        title: 'Failed to select partner',
        description: 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      state.updateState({ loading: false });
    }
  }, [state, toast]);

  const handlePreferencesComplete = useCallback(async (preferences: any, sessionId?: string) => {
    console.log('🎯 PREFERENCES COMPLETE:', { preferences, sessionId, hasCurrentSession: !!state.currentSession });

    if (!state.currentSession && !sessionId) {
      toast({
        title: 'No active session',
        description: 'Please start over.',
        variant: 'destructive'
      });
      return;
    }

    const activeSessionId = sessionId || state.currentSession?.id;
    
    try {
      state.updateState({ loading: true, aiAnalyzing: true });

      // Update session preferences
      const { error: updateError } = await supabase
        .from('date_planning_sessions')
        .update({
          preferences_data: preferences,
          [`${state.currentSession?.initiator_id === state.user.id ? 'initiator' : 'partner'}_preferences_complete`]: true
        })
        .eq('id', activeSessionId);

      if (updateError) throw updateError;

      // For collaborative mode, check if we need to wait for partner
      if (state.isCollaborative) {
        // Refetch session to get latest state
        if (state.fetchSession) {
          await state.fetchSession(activeSessionId!);
        }
        
        // If both preferences are complete, trigger AI analysis
        if (state.currentSession?.both_preferences_complete) {
          console.log('🤖 Both preferences complete, starting AI analysis');
          await state.analyzeCompatibilityAndVenues(
            activeSessionId!,
            state.selectedPartnerId,
            preferences,
            state.userLocation
          );
        } else {
          console.log('⏳ Waiting for partner preferences...');
          state.updateState({ aiAnalyzing: false });
        }
      } else {
        // Solo mode - trigger AI analysis immediately
        console.log('🤖 Solo mode: Starting AI analysis');
        await state.analyzeCompatibilityAndVenues(
          activeSessionId!,
          state.selectedPartnerId,
          preferences,
          state.userLocation
        );
      }

    } catch (error) {
      console.error('Preferences completion failed:', error);
      toast({
        title: 'Failed to save preferences',
        description: 'Please try again.',
        variant: 'destructive'
      });
      state.updateState({ aiAnalyzing: false });
    } finally {
      state.updateState({ loading: false });
    }
  }, [state, toast]);

  const handleVenueSelection = useCallback((venueId: string) => {
    console.log('🎯 VENUE SELECTION:', { venueId });
    
    const selectedVenue = state.venueRecommendations.find(v => 
      v.venue_id === venueId || v.id === venueId
    );
    
    if (!selectedVenue) {
      toast({
        title: 'Venue not found',
        description: 'Please select a valid venue.',
        variant: 'destructive'
      });
      return;
    }

    state.updateState({ selectedVenueId: venueId });
    
    // Generate AI invitation message
    const message = `Hi! I'd love to take you to ${selectedVenue.venue_name || selectedVenue.name} for our date. ${selectedVenue.ai_reasoning || 'This place looks perfect for us!'} Let me know if you're interested!`;
    
    state.updateState({ invitationMessage: message });
    state.advanceStep();
  }, [state, toast]);

  const handleSendInvitation = useCallback(async () => {
    if (!state.currentSession || !state.selectedVenueId || !state.invitationMessage) {
      toast({
        title: 'Missing information',
        description: 'Please ensure all fields are complete.',
        variant: 'destructive'
      });
      return;
    }

    try {
      state.updateState({ loading: true });

      // Complete the planning session
      const { error: sessionError } = await supabase
        .from('date_planning_sessions')
        .update({
          session_status: 'completed',
          selected_venue_id: state.selectedVenueId
        })
        .eq('id', state.currentSession.id);

      if (sessionError) throw sessionError;

      // Create the invitation
      const invitationData = {
        sender_id: state.user.id,
        recipient_id: state.currentSession.partner_id,
        venue_id: state.selectedVenueId,
        title: 'AI-Matched Date Invitation',
        message: state.invitationMessage,
        planning_session_id: state.currentSession.id,
        ai_compatibility_score: state.currentSession.ai_compatibility_score,
        status: 'pending'
      };

      const { error: inviteError } = await supabase
        .from('date_invitations')
        .insert(invitationData);

      if (inviteError) throw inviteError;

      toast({
        title: 'Invitation sent!',
        description: 'Your date invitation has been sent successfully.',
      });

      // Navigate back to home
      state.navigate('/home', {
        state: { message: 'Date invitation sent successfully!' }
      });

    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast({
        title: 'Failed to send invitation',
        description: 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      state.updateState({ loading: false });
    }
  }, [state, toast]);

  const handleStartFromScratch = useCallback(() => {
    state.updateState({
      currentStep: 'select-partner',
      selectedPartnerId: '',
      selectedPartnerIds: [],
      selectedVenueId: '',
      invitationMessage: '',
      compatibilityScore: null,
      venueRecommendations: [],
      currentSession: null,
      aiAnalyzing: false
    });
  }, [state]);

  const handleRetrySearch = useCallback(async () => {
    if (!state.currentSession) return;
    
    try {
      state.updateState({ aiAnalyzing: true, venueSearchError: null });
      
      await state.analyzeCompatibilityAndVenues(
        state.currentSession.id,
        state.selectedPartnerId,
        state.currentSession.preferences_data || {},
        state.userLocation
      );
    } catch (error) {
      console.error('Retry search failed:', error);
      toast({
        title: 'Search failed',
        description: 'Please try again.',
        variant: 'destructive'
      });
    }
  }, [state, toast]);

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
              onContinue={() => handlePartnerSelection()}
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
                onPreferencesComplete={(preferences) => handlePreferencesComplete(preferences, state.currentSession?.id)}
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
              onVenueSelect={handleVenueSelection}
              error={state.venueSearchError || undefined}
              onRetrySearch={handleRetrySearch}
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
              onSendInvitation={handleSendInvitation}
            />
          </div>
        )}

        {/* Start from Scratch CTA */}
        {state.currentStep !== 'select-partner' && (
          <div className="pt-8 border-t border-border/50 animate-fade-in">
            <Button 
              onClick={handleStartFromScratch}
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