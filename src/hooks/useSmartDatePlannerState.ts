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
  planningMode?: 'collaborative'; // Only collaborative mode supported
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

  console.log('SmartDatePlanner - Starting with user:', user?.id);
  console.log('SmartDatePlanner - Preselected friend:', preselectedFriend);
  console.log('SmartDatePlanner - User location:', appState.userLocation);

  // Initialize hooks - must be called unconditionally (Rules of Hooks)
  const friendsResult = useFriends();
  const datePlanningState = useDatePlanning(appState.userLocation);
  const planningStepsState = usePlanningSteps({ preselectedFriend, planningMode });
  
  // Use collaborative session state when sessionId is provided
  const collaborativeState = useCollaborativeSessionState({ 
    sessionId, 
    userLocation: appState.userLocation 
  });

  // Extract data with error handling after hooks are called
  const friends = friendsResult.friends || [];
  const friendsError = null; // Remove try-catch error handling for hooks
  const datePlanningError = null; // Remove try-catch error handling for hooks  
  const planningStepsError = null; // Remove try-catch error handling for hooks

  console.log('SmartDatePlanner - Friends loaded:', friends.length);
  console.log('✅ SmartDatePlanner - Date planning state loaded with location:', appState.userLocation);
  console.log('✅ SmartDatePlanner - analyzeCompatibilityAndVenues function available:', typeof datePlanningState?.analyzeCompatibilityAndVenues);
  console.log('🔧 SmartDatePlanner - Collaborative state:', {
    hasCollaborativeSession: !!collaborativeState.collaborativeSession,
    collaborativeVenueCount: collaborativeState.collaborativeVenueRecommendations?.length || 0,
    collaborativeCompatibilityScore: collaborativeState.collaborativeCompatibilityScore,
    collaborativeVenueRecommendations: collaborativeState.collaborativeVenueRecommendations,
    collaborativeSessionPreferencesData: collaborativeState.collaborativeSession?.preferences_data
  });

  // Extract states from hooks (with defaults if null) - prioritize collaborative session data
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
  
  console.log('🔧 VENUE RECOMMENDATIONS STATE CHECK:', {
    collaborativeVenues: collaborativeState.collaborativeVenueRecommendations?.length || 0,
    singleUserVenues: singleUserVenueRecommendations?.length || 0,
    finalVenues: venueRecommendations?.length || 0,
    usingCollaborative: (collaborativeState.collaborativeVenueRecommendations?.length || 0) > 0,
    collaborativeVenueData: collaborativeState.collaborativeVenueRecommendations?.slice(0, 2),
    sessionData: collaborativeState.collaborativeSession?.preferences_data?.slice(0, 2)
  });

  const {
    currentStep,
    setCurrentStep,
    selectedPartnerId,
    setSelectedPartnerId,
    getStepProgress,
    goBack
  } = planningStepsState || {
    currentStep: 'select-partner',
    setCurrentStep: () => {},
    selectedPartnerId: '',
    setSelectedPartnerId: () => {},
    getStepProgress: () => 0,
    goBack: () => {}
  };

  const [selectedVenueId, setSelectedVenueId] = useState<string>('');
  const [invitationMessage, setInvitationMessage] = useState<string>('');
  const [locationRequested, setLocationRequested] = useState(false);
  const [dateMode, setDateMode] = useState<'single' | 'group'>('single');
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
        console.log('🔄 VENUE SYNC: Selected venue no longer exists in recommendations, clearing selection:', {
          selectedVenueId,
          currentVenueIds: venueRecommendations.map(v => v.venue_id).slice(0, 3),
          venueCount: venueRecommendations.length
        });
        
        setSelectedVenueId('');
        setInvitationMessage('');
        
        // If user was on invitation step, move them back to venue selection
        if (currentStep === 'create-invitation') {
          setCurrentStep('review-matches');
        }
      }
    }
  }, [venueRecommendations, selectedVenueId, currentStep, setCurrentStep]);

  // Auto-navigate to Results page when venues are found
  useEffect(() => {
    if (venueRecommendations && venueRecommendations.length > 0 && !aiAnalyzing && currentStep === 'set-preferences') {
      // Store venues in app context for Results page
      console.log('🎯 Auto-navigating to Results page with', venueRecommendations.length, 'venues');
      
      // Convert AI venue recommendations to app venues format
      const appVenues = venueRecommendations.map(rec => ({
        id: rec.venue_id,
        name: rec.venue_name,
        address: rec.venue_address,
        image_url: rec.venue_image,
        rating: rec.match_factors?.rating || 4.5,
        price_range: rec.match_factors?.price_range || '$$',
        cuisine_type: 'unknown',
        matchScore: Math.round(rec.ai_score * 100), // Convert to percentage
        tags: rec.match_factors?.vibe_matches || []
      }));
      
      // Update app context and navigate to results
      setTimeout(() => {
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
      }, 500); // Small delay to ensure smooth transition
    }
  }, [venueRecommendations, aiAnalyzing, currentStep, navigate, collaborativeState.collaborativeSession?.id, sessionId, selectedPartnerId, compatibilityScore]);

  // Firefox-optimized location request to prevent flickering
  const handleLocationRequest = useCallback(async () => {
    // Prevent multiple simultaneous requests that cause flickering
    if (locationRequestInProgress) {
      console.log('🦊 Location request already in progress, skipping...');
      return;
    }

    console.log('🦊 SmartDatePlanner - Requesting location permission');
    setLocationRequestInProgress(true);
    setLocationRequested(true);
    
    try {
      await requestLocation();
    } catch (error) {
      console.error('🦊 Location request failed:', error);
    } finally {
      // Reset flags after a delay to prevent rapid retries
      setTimeout(() => {
        setLocationRequestInProgress(false);
        setLocationRequested(false);
      }, 3000); // 3 second cooldown
    }
  }, [requestLocation, locationRequestInProgress]);

  // Request location only once when user is detected, with Firefox-specific handling
  useEffect(() => {
    if (user && !appState.userLocation && !appState.locationError && !locationRequestInProgress) {
      const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
      
      console.log('🎯 PLANNER STATE: User detected, requesting location', { 
        isFirefox, 
        hasLocation: !!appState.userLocation,
        hasError: !!appState.locationError
      });
      
      // For Firefox, add a small delay to prevent issues with rapid state changes
      if (isFirefox) {
        setTimeout(() => {
          handleLocationRequest();
        }, 500);
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
    selectedPartnerIds,
    setSelectedPartnerIds,
    currentPreferences,
    setCurrentPreferences,
    // Include collaborative session state
    ...collaborativeState
  };
};