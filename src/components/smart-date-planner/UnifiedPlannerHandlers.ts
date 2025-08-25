import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UnifiedPlannerState {
  user: any;
  currentSession: any;
  selectedPartnerId: string;
  selectedPartnerIds: string[];
  dateMode: 'single' | 'group';
  isCollaborative: boolean;
  userLocation: any;
  selectedVenueId: string;
  venueRecommendations: any[];
  invitationMessage: string;
  updateState: (updates: any) => void;
  createPlanningSession: (partnerId: string, participantIds?: string[], mode?: 'solo' | 'collaborative') => Promise<any>;
  analyzeCompatibilityAndVenues: (sessionId: string, partnerId: string, preferences: any, userLocation?: any) => Promise<void>;
  advanceStep: () => void;
  navigate: (path: string, options?: any) => void;
  fetchSession?: (sessionId: string) => Promise<any>;
}

export const createUnifiedPlannerHandlers = (state: UnifiedPlannerState) => {
  const { toast } = useToast();

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

  return {
    handlePartnerSelection,
    handlePreferencesComplete,
    handleVenueSelection,
    handleSendInvitation,
    handleStartFromScratch,
    handleRetrySearch
  };
};