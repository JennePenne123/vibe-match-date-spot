import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { useApp } from '@/contexts/AppContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { supabase } from '@/integrations/supabase/client';

// Types
interface DatePlanningSession {
  id: string;
  initiator_id: string;
  partner_id: string;
  session_status: 'active' | 'completed' | 'expired';
  preferences_data?: any;
  ai_compatibility_score?: number;
  selected_venue_id?: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  initiator_preferences_complete: boolean;
  partner_preferences_complete: boolean;
  both_preferences_complete: boolean;
  planning_mode: string;
}

interface DatePreferences {
  preferred_cuisines?: string[];
  preferred_price_range?: string[];
  preferred_times?: string[];
  preferred_vibes?: string[];
  max_distance?: number;
  dietary_restrictions?: string[];
  preferred_date?: Date;
  preferred_time?: string;
}

interface UnifiedPlanningState {
  // Session management
  currentSession: DatePlanningSession | null;
  loading: boolean;
  error: string | null;
  
  // Planning flow
  currentStep: 'select-partner' | 'set-preferences' | 'review-matches' | 'create-invitation';
  selectedPartnerId: string;
  selectedPartnerIds: string[];
  dateMode: 'single' | 'group';
  
  // AI results
  compatibilityScore: number | null;
  venueRecommendations: any[];
  venueSearchError: string | null;
  aiAnalyzing: boolean;
  
  // Venue selection
  selectedVenueId: string;
  invitationMessage: string;
  
  // Location
  userLocation: { latitude: number; longitude: number; address?: string } | null;
  locationError: string | null;
  locationRequested: boolean;
  
  // Collaborative state
  isCollaborative: boolean;
  isUserInitiator: boolean;
  isUserPartner: boolean;
  hasUserSetPreferences: boolean;
  hasPartnerSetPreferences: boolean;
  canShowResults: boolean;
  isWaitingForPartner: boolean;
}

interface UseUnifiedDatePlanningProps {
  preselectedFriend?: { id: string; name: string } | null;
  planningMode?: 'solo' | 'collaborative';
  sessionId?: string | null;
  fromProposal?: boolean;
}

export const useUnifiedDatePlanning = ({
  preselectedFriend,
  planningMode = 'solo',
  sessionId = null,
  fromProposal = false
}: UseUnifiedDatePlanningProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { friends, loading: friendsLoading } = useFriends();
  const { appState, requestLocation } = useApp();
  const { handleError } = useErrorHandler();
  
  // Consolidated state
  const [state, setState] = useState<UnifiedPlanningState>({
    currentSession: null,
    loading: false,
    error: null,
    currentStep: 'select-partner',
    selectedPartnerId: preselectedFriend?.id || '',
    selectedPartnerIds: [],
    dateMode: 'single',
    compatibilityScore: null,
    venueRecommendations: [],
    venueSearchError: null,
    aiAnalyzing: false,
    selectedVenueId: '',
    invitationMessage: '',
    userLocation: appState.userLocation,
    locationError: appState.locationError,
    locationRequested: false,
    isCollaborative: planningMode === 'collaborative',
    isUserInitiator: false,
    isUserPartner: false,
    hasUserSetPreferences: false,
    hasPartnerSetPreferences: false,
    canShowResults: false,
    isWaitingForPartner: false
  });

  const realtimeChannelRef = useRef<any>(null);
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update state helper
  const updateState = useCallback((updates: Partial<UnifiedPlanningState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Session management functions
  const fetchSession = useCallback(async (id: string) => {
    if (!user) return null;
    
    updateState({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('date_planning_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Calculate collaborative state
      const isUserInitiator = data.initiator_id === user.id;
      const isUserPartner = data.partner_id === user.id;
      const hasUserSetPreferences = isUserInitiator ? data.initiator_preferences_complete : data.partner_preferences_complete;
      const hasPartnerSetPreferences = isUserInitiator ? data.partner_preferences_complete : data.initiator_preferences_complete;
      const canShowResults = data.both_preferences_complete;
      const isWaitingForPartner = state.isCollaborative && !canShowResults && hasUserSetPreferences && !hasPartnerSetPreferences;

      updateState({
        currentSession: data,
        loading: false,
        isUserInitiator,
        isUserPartner,
        hasUserSetPreferences,
        hasPartnerSetPreferences,
        canShowResults,
        isWaitingForPartner,
        compatibilityScore: data.ai_compatibility_score || null
      });

      return data;
    } catch (err) {
      console.error('Error fetching session:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch session';
      updateState({ loading: false, error: errorMessage });
      return null;
    }
  }, [user, state.isCollaborative, updateState]);

  const createPlanningSession = useCallback(async (partnerId: string, participantIds?: string[], mode?: 'solo' | 'collaborative') => {
    if (!user) throw new Error('User not authenticated');
    
    updateState({ loading: true, error: null });
    
    try {
      // Check for existing active session first
      const { data: existingSession } = await supabase
        .from('date_planning_sessions')
        .select('*')
        .eq('initiator_id', user.id)
        .eq('partner_id', partnerId)
        .eq('session_status', 'active')
        .single();

      if (existingSession) {
        console.log('Found existing session:', existingSession.id);
        await fetchSession(existingSession.id);
        return existingSession;
      }

      // Create new session
      const sessionData = {
        initiator_id: user.id,
        partner_id: partnerId,
        participant_ids: participantIds || [user.id, partnerId],
        planning_mode: mode || planningMode,
        session_status: 'active' as const,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      };

      const { data: newSession, error } = await supabase
        .from('date_planning_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;

      console.log('Created new session:', newSession.id);
      await fetchSession(newSession.id);
      return newSession;
    } catch (err) {
      console.error('Error creating session:', err);
      handleError(err, {
        toastTitle: 'Failed to create planning session',
        toastDescription: 'Please try again'
      });
      updateState({ loading: false, error: err instanceof Error ? err.message : 'Failed to create session' });
      throw err;
    }
  }, [user, planningMode, fetchSession, handleError, updateState]);

  // AI Analysis
  const analyzeCompatibilityAndVenues = useCallback(async (sessionId: string, partnerId: string, preferences: DatePreferences, userLocation?: any) => {
    if (!state.currentSession) return;

    updateState({ aiAnalyzing: true, error: null });
    
    try {
      console.log('🎯 AI ANALYSIS: Starting analysis with location:', userLocation);
      
      const { data, error } = await supabase.functions.invoke('analyze-compatibility', {
        body: {
          sessionId,
          partnerId,
          preferences,
          userLocation
        }
      });

      if (error) throw error;

      updateState({
        compatibilityScore: data.compatibilityScore,
        venueRecommendations: data.venueRecommendations || [],
        aiAnalyzing: false,
        venueSearchError: null
      });

      console.log('✅ AI ANALYSIS: Complete', { score: data.compatibilityScore, venues: data.venueRecommendations?.length });
    } catch (err) {
      console.error('AI analysis failed:', err);
      updateState({ 
        aiAnalyzing: false, 
        venueSearchError: err instanceof Error ? err.message : 'AI analysis failed' 
      });
    }
  }, [state.currentSession, updateState]);

  // Real-time subscription
  useEffect(() => {
    if (!state.currentSession) return;

    console.log('Setting up real-time subscription for session:', state.currentSession.id);
    
    const channel = supabase
      .channel(`planning-session-${state.currentSession.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'date_planning_sessions',
          filter: `id=eq.${state.currentSession.id}`,
        },
        (payload) => {
          console.log('Session updated via realtime:', payload);
          const updatedSession = payload.new as DatePlanningSession;
          
          // Update collaborative state
          const isUserInitiator = updatedSession.initiator_id === user?.id;
          const hasUserSetPreferences = isUserInitiator ? updatedSession.initiator_preferences_complete : updatedSession.partner_preferences_complete;
          const hasPartnerSetPreferences = isUserInitiator ? updatedSession.partner_preferences_complete : updatedSession.initiator_preferences_complete;
          const canShowResults = updatedSession.both_preferences_complete;
          const isWaitingForPartner = state.isCollaborative && !canShowResults && hasUserSetPreferences && !hasPartnerSetPreferences;

          updateState({
            currentSession: updatedSession,
            hasUserSetPreferences,
            hasPartnerSetPreferences,
            canShowResults,
            isWaitingForPartner,
            compatibilityScore: updatedSession.ai_compatibility_score || state.compatibilityScore
          });
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      console.log('Removing real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [state.currentSession?.id, state.isCollaborative, user?.id, updateState]);

  // Location management
  const handleLocationRequest = useCallback(async () => {
    if (state.locationRequested) return;
    
    updateState({ locationRequested: true });
    
    try {
      await requestLocation();
      updateState({ 
        userLocation: appState.userLocation,
        locationError: appState.locationError 
      });
    } catch (error) {
      console.error('Location request failed:', error);
      updateState({ locationError: error instanceof Error ? error.message : 'Location request failed' });
    } finally {
      setTimeout(() => updateState({ locationRequested: false }), 3000);
    }
  }, [state.locationRequested, requestLocation, appState.userLocation, appState.locationError, updateState]);

  // Step management
  const advanceStep = useCallback(() => {
    const stepOrder = ['select-partner', 'set-preferences', 'review-matches', 'create-invitation'] as const;
    const currentIndex = stepOrder.indexOf(state.currentStep);
    if (currentIndex < stepOrder.length - 1) {
      updateState({ currentStep: stepOrder[currentIndex + 1] });
    }
  }, [state.currentStep, updateState]);

  const goToStep = useCallback((step: UnifiedPlanningState['currentStep']) => {
    updateState({ currentStep: step });
  }, [updateState]);

  // Progress calculation
  const getStepProgress = useCallback(() => {
    const steps = ['select-partner', 'set-preferences', 'review-matches', 'create-invitation'];
    const currentIndex = steps.indexOf(state.currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  }, [state.currentStep]);

  // Auto-advance logic
  useEffect(() => {
    if (state.compatibilityScore !== null && state.currentStep === 'set-preferences') {
      console.log('Auto-advancing to review step after AI analysis');
      updateState({ currentStep: 'review-matches', aiAnalyzing: false });
    }
  }, [state.compatibilityScore, state.currentStep, updateState]);

  // Load session on mount if provided
  useEffect(() => {
    if (sessionId && fromProposal) {
      fetchSession(sessionId);
    }
  }, [sessionId, fromProposal, fetchSession]);

  // Auto-request location
  useEffect(() => {
    if (user && !appState.userLocation && !appState.locationError && !state.locationRequested) {
      setTimeout(handleLocationRequest, 500);
    }
  }, [user, appState.userLocation, appState.locationError, state.locationRequested, handleLocationRequest]);

  return {
    // State
    ...state,
    friends,
    friendsLoading,
    user,
    
    // Computed values
    selectedPartner: friends.find(f => f.id === state.selectedPartnerId),
    selectedVenue: state.venueRecommendations.find(v => v.venue_id === state.selectedVenueId),
    getStepProgress,
    
    // Actions
    updateState,
    fetchSession,
    createPlanningSession,
    analyzeCompatibilityAndVenues,
    handleLocationRequest,
    advanceStep,
    goToStep,
    navigate,
    
    // Setters for backward compatibility
    setSelectedPartnerId: (id: string) => updateState({ selectedPartnerId: id }),
    setSelectedPartnerIds: (ids: string[]) => updateState({ selectedPartnerIds: ids }),
    setDateMode: (mode: 'single' | 'group') => updateState({ dateMode: mode }),
    setSelectedVenueId: (id: string) => updateState({ selectedVenueId: id }),
    setInvitationMessage: (message: string) => updateState({ invitationMessage: message }),
    setCurrentStep: (step: UnifiedPlanningState['currentStep']) => updateState({ currentStep: step }),
    setAiAnalyzing: (analyzing: boolean) => updateState({ aiAnalyzing: analyzing })
  };
};