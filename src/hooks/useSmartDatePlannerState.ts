import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatePlanning } from '@/hooks/useDatePlanning';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanningSteps } from '@/hooks/usePlanningSteps';
import { useApp } from '@/contexts/AppContext';
import { useCollaborativeSessionState } from '@/hooks/useCollaborativeSessionState';

interface UseSmartDatePlannerStateProps {
  preselectedFriend?: { id: string; name: string } | null;
  planningMode?: 'collaborative';
  sessionId?: string | null;
}

export const useSmartDatePlannerState = ({ 
  preselectedFriend, 
  planningMode = 'collaborative',
  sessionId 
}: UseSmartDatePlannerStateProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { appState, requestLocation } = useApp();

  // Initialize hooks - must be called unconditionally (Rules of Hooks)
  const friendsResult = useFriends();
  const datePlanningState = useDatePlanning(appState.userLocation);
  const planningStepsState = usePlanningSteps({ preselectedFriend, planningMode });
  
  // Use collaborative session state when sessionId is provided
  const collaborativeState = useCollaborativeSessionState({ 
    sessionId, 
    userLocation: appState.userLocation 
  });

  const friends = friendsResult.friends || [];
  const friendsError = null;
  const datePlanningError = null;
  const planningStepsError = null;

  // Extract states from hooks - prioritize collaborative session data
  const {
    currentSession,
    loading,
    compatibilityScore: singleUserCompatibilityScore,
    venueRecommendations: singleUserVenueRecommendations,
    venueSearchError,
    analyzeCompatibilityAndVenues,
    createPlanningSession,
    getActiveSession,
    completePlanningSession,
    updateSessionPreferences
  } = datePlanningState || {
    currentSession: null,
    loading: false,
    compatibilityScore: null,
    venueRecommendations: [],
    venueSearchError: null,
    analyzeCompatibilityAndVenues: async () => {},
    createPlanningSession: async () => {},
    getActiveSession: async () => null,
    completePlanningSession: async () => false,
    updateSessionPreferences: async () => {}
  };

  // Prioritize collaborative session data when available
  const compatibilityScore = collaborativeState.collaborativeCompatibilityScore ?? singleUserCompatibilityScore;
  const venueRecommendations = collaborativeState.collaborativeVenueRecommendations?.length > 0 
    ? collaborativeState.collaborativeVenueRecommendations 
    : singleUserVenueRecommendations || [];
  const aiAnalyzing = collaborativeState.collaborativeAiAnalyzing || loading;

  const {
    currentStep,
    setCurrentStep,
    selectedPartnerId,
    setSelectedPartnerId,
    getStepProgress,
    goBack,
    dateMode,
    setDateMode,
    handleModeSelect,
  } = planningStepsState || {
    currentStep: 'select-mode' as const,
    setCurrentStep: () => {},
    selectedPartnerId: '',
    setSelectedPartnerId: () => {},
    getStepProgress: () => 0,
    goBack: () => {},
    dateMode: 'single' as const,
    setDateMode: () => {},
    handleModeSelect: () => {},
  };

  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [invitationMessage, setInvitationMessage] = useState<string>('');
  const [locationRequested, setLocationRequested] = useState(false);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [currentPreferences, setCurrentPreferences] = useState<any>(null);
  const [locationRequestInProgress, setLocationRequestInProgress] = useState(false);
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectedPartner = friends.find(f => f.id === selectedPartnerId);
  const selectedVenue = venueRecommendations.find(v => v.venue_id === selectedVenueId);

  // State synchronization: Reset selected venue when recommendations change
  useEffect(() => {
    if (selectedVenueId && venueRecommendations.length > 0) {
      const venueStillExists = venueRecommendations.some(v => v.venue_id === selectedVenueId);
      
      if (!venueStillExists) {
        setSelectedVenueId('');
        setInvitationMessage('');
        
        if (currentStep === 'create-invitation') {
          setCurrentStep('plan-together');
        }
      }
    }
  }, [venueRecommendations, selectedVenueId, currentStep, setCurrentStep]);

  // Manual navigation helper function for Display Venues button
  const navigateToResults = useCallback(() => {
    if (venueRecommendations && venueRecommendations.length > 0) {
      const appVenues = venueRecommendations.map(rec => ({
        id: rec.venue_id,
        name: rec.venue_name,
        address: rec.venue_address,
        image_url: rec.venue_image,
        rating: rec.match_factors?.rating || 4.5,
        price_range: rec.match_factors?.price_range || '$$',
        cuisine_type: 'unknown',
        matchScore: Math.round(rec.ai_score * 100),
        tags: rec.match_factors?.vibe_matches || []
      }));
      
      navigate('/results', { 
        state: { 
          fromSmartDatePlanning: true,
          sessionId: collaborativeState.collaborativeSession?.id || sessionId,
          partnerId: selectedPartnerId,
          compatibilityScore: compatibilityScore,
          venues: appVenues,
          venueRecommendations: venueRecommendations
        }
      });
    }
  }, [venueRecommendations, navigate, collaborativeState.collaborativeSession?.id, sessionId, selectedPartnerId, compatibilityScore]);

  // Firefox-optimized location request to prevent flickering
  const handleLocationRequest = useCallback(async () => {
    if (locationRequestInProgress) return;

    setLocationRequestInProgress(true);
    setLocationRequested(true);
    
    try {
      await requestLocation();
    } catch (error) {
      console.error('Location request failed:', error);
    } finally {
      setTimeout(() => {
        setLocationRequestInProgress(false);
        setLocationRequested(false);
      }, 3000);
    }
  }, [requestLocation, locationRequestInProgress]);

  // Request location only once when user is detected
  useEffect(() => {
    if (user && !appState.userLocation && !appState.locationError && !locationRequestInProgress) {
      const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
      
      if (isFirefox) {
        setTimeout(() => handleLocationRequest(), 500);
      } else {
        handleLocationRequest();
      }
    }
  }, [user, appState.userLocation, appState.locationError, locationRequestInProgress, handleLocationRequest]);

  return {
    user,
    friends,
    friendsError,
    datePlanningError,
    planningStepsError,
    currentSession,
    loading,
    compatibilityScore,
    venueRecommendations,
    venueSearchError,
    analyzeCompatibilityAndVenues,
    createPlanningSession,
    getActiveSession,
    completePlanningSession,
    updateSessionPreferences,
    currentStep,
    setCurrentStep,
    selectedPartnerId,
    setSelectedPartnerId,
    getStepProgress,
    goBack,
    selectedVenueId,
    setSelectedVenueId,
    invitationMessage,
    setInvitationMessage,
    aiAnalyzing,
    selectedPartner,
    selectedVenue,
    navigate,
    userLocation: appState.userLocation,
    locationError: appState.locationError,
    requestLocation: handleLocationRequest,
    locationRequested,
    dateMode,
    setDateMode,
    handleModeSelect,
    selectedPartnerIds,
    setSelectedPartnerIds,
    currentPreferences,
    setCurrentPreferences,
    navigateToResults,
    // Include collaborative session state
    ...collaborativeState
  };
};
