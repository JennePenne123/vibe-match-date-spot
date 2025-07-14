import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDatePlanning } from '@/hooks/useDatePlanning';
import { useFriends } from '@/hooks/useFriends';
import { useAuth } from '@/contexts/AuthContext';
import { usePlanningSteps } from '@/hooks/usePlanningSteps';
import { useApp } from '@/contexts/AppContext';

interface UseSmartDatePlannerStateProps {
  preselectedFriend?: { id: string; name: string } | null;
}

export const useSmartDatePlannerState = ({ preselectedFriend }: UseSmartDatePlannerStateProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { appState, requestLocation } = useApp();

  console.log('SmartDatePlanner - Starting with user:', user?.id);
  console.log('SmartDatePlanner - Preselected friend:', preselectedFriend);
  console.log('SmartDatePlanner - User location:', appState.userLocation);

  // Initialize hooks with error handling
  let friends = [];
  let friendsError = null;
  
  try {
    const friendsResult = useFriends();
    friends = friendsResult.friends || [];
    console.log('SmartDatePlanner - Friends loaded:', friends.length);
  } catch (error) {
    console.error('SmartDatePlanner - Error loading friends:', error);
    friendsError = error;
  }

  let datePlanningState = null;
  let datePlanningError = null;
  
  try {
    datePlanningState = useDatePlanning(appState.userLocation);
    console.log('SmartDatePlanner - Date planning state loaded with location:', appState.userLocation);
  } catch (error) {
    console.error('SmartDatePlanner - Error loading date planning state:', error);
    datePlanningError = error;
  }

  let planningStepsState = null;
  let planningStepsError = null;
  
  try {
    planningStepsState = usePlanningSteps({ preselectedFriend });
    console.log('SmartDatePlanner - Planning steps loaded');
  } catch (error) {
    console.error('SmartDatePlanner - Error loading planning steps:', error);
    planningStepsError = error;
  }

  // Extract states from hooks (with defaults if null)
  const {
    currentSession,
    loading,
    compatibilityScore,
    venueRecommendations,
    createPlanningSession,
    getActiveSession,
    completePlanningSession
  } = datePlanningState || {
    currentSession: null,
    loading: false,
    compatibilityScore: null,
    venueRecommendations: [],
    createPlanningSession: async () => {},
    getActiveSession: async () => null,
    completePlanningSession: async () => false
  };

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
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const selectedPartner = friends.find(f => f.id === selectedPartnerId);
  const selectedVenue = venueRecommendations.find(v => v.venue_id === selectedVenueId);

  // Check for existing session when partner is selected
  useEffect(() => {
    if (selectedPartnerId && currentStep === 'select-partner') {
      console.log('SmartDatePlanner - Checking for existing session');
      getActiveSession(selectedPartnerId).then(session => {
        if (session) {
          console.log('SmartDatePlanner - Found existing session, advancing step');
          setCurrentStep('set-preferences');
        }
      }).catch(error => {
        console.error('SmartDatePlanner - Error getting active session:', error);
      });
    }
  }, [selectedPartnerId, getActiveSession, currentStep, setCurrentStep]);

  // Monitor compatibility score and venue recommendations with timeout
  useEffect(() => {
    if (compatibilityScore !== null && currentStep === 'set-preferences') {
      console.log('SmartDatePlanner - AI analysis complete, advancing to review step');
      setAiAnalyzing(false);
      setCurrentStep('review-matches');
    }
  }, [compatibilityScore, currentStep, setCurrentStep]);

  // Add timeout for AI analysis
  useEffect(() => {
    if (aiAnalyzing) {
      const timeoutId = setTimeout(() => {
        if (currentStep === 'set-preferences' && aiAnalyzing) {
          console.log('SmartDatePlanner - AI analysis timeout, advancing anyway');
          setAiAnalyzing(false);
          setCurrentStep('review-matches');
        }
      }, 35000); // 35 second timeout

      return () => clearTimeout(timeoutId);
    }
  }, [aiAnalyzing, currentStep, setCurrentStep]);

  // Request location permission when Smart Date Planner is used
  useEffect(() => {
    if (user && !appState.userLocation && !appState.locationError) {
      console.log('SmartDatePlanner - Requesting location permission');
      requestLocation();
    }
  }, [user, appState.userLocation, appState.locationError, requestLocation]);

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
    createPlanningSession,
    getActiveSession,
    completePlanningSession,
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
    setAiAnalyzing,
    selectedPartner,
    selectedVenue,
    navigate,
    userLocation: appState.userLocation,
    locationError: appState.locationError,
    requestLocation
  };
};