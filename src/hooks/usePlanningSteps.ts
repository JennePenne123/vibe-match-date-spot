
import { useState, useEffect, useRef } from 'react';
import { useFriends } from '@/hooks/useFriends';

export type PlanningStep = 'select-partner' | 'set-preferences' | 'review-matches' | 'create-invitation';

interface UsePlanningStepsProps {
  preselectedFriend?: { id: string; name: string } | null;
  planningMode?: 'solo' | 'collaborative';
}

export const usePlanningSteps = ({ preselectedFriend, planningMode = 'solo' }: UsePlanningStepsProps) => {
  const { friends } = useFriends();
  // For collaborative mode with preselected friend, start at preferences
  const initialStep = (planningMode === 'collaborative' && preselectedFriend) ? 'set-preferences' : 'select-partner';
  
  console.log('🔧 Planning Steps - Initialization:', {
    preselectedFriend: preselectedFriend?.name,
    planningMode,
    initialStep,
    willStartAtPreferences: planningMode === 'collaborative' && !!preselectedFriend
  });
  
  const [currentStep, setCurrentStep] = useState<PlanningStep>(initialStep);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(preselectedFriend?.id || '');
  const [hasManuallyNavigated, setHasManuallyNavigated] = useState(false);
  const hasAutoAdvanced = useRef(false);

  // Auto-advance if friend is pre-selected (only for solo mode)
  useEffect(() => {
    console.log('Planning steps - Auto-advance check:', { 
      preselectedFriend, 
      friendsLength: friends.length, 
      hasAutoAdvanced: hasAutoAdvanced.current,
      hasManuallyNavigated,
      currentStep,
      planningMode
    });
    
    // Only auto-advance for solo mode - collaborative should start at preferences
    if (preselectedFriend && friends.length > 0 && !hasAutoAdvanced.current && !hasManuallyNavigated && currentStep === 'select-partner' && planningMode === 'solo') {
      const friend = friends.find(f => f.id === preselectedFriend.id);
      if (friend) {
        console.log('Planning steps - Auto-advancing for preselected friend (solo mode):', friend.name);
        setSelectedPartnerId(friend.id);
        setCurrentStep('set-preferences');
        hasAutoAdvanced.current = true;
      }
    }
  }, [preselectedFriend, friends, hasManuallyNavigated, currentStep, planningMode]);

  const getStepProgress = () => {
    if (planningMode === 'collaborative') {
      // Collaborative mode: skip partner selection, so 3 steps: preferences -> review -> invitation
      switch (currentStep) {
        case 'select-partner': return 0; // Should not be shown
        case 'set-preferences': return 33;
        case 'review-matches': return 66;
        case 'create-invitation': return 100;
        default: return 0;
      }
    } else {
      // Solo mode: 4 steps: select -> preferences -> review -> invitation
      switch (currentStep) {
        case 'select-partner': return 25;
        case 'set-preferences': return 50;
        case 'review-matches': return 75;
        case 'create-invitation': return 100;
        default: return 0;
      }
    }
  };

  const goBack = (preselectedFriend?: { id: string; name: string } | null, navigate?: (path: string) => void) => {
    console.log('Planning steps - Going back from:', currentStep);
    setHasManuallyNavigated(true);
    
    switch (currentStep) {
      case 'select-partner':
        if (navigate) {
          navigate('/home');
        }
        break;
      case 'set-preferences': 
        // If we have a preselected friend, skip back to avoid re-selection
        if (preselectedFriend) {
          console.log('Planning steps - Preselected friend detected, going back to home');
          if (navigate) {
            navigate('/home');
          }
        } else {
          console.log('Planning steps - Navigating back to select-partner');
          setCurrentStep('select-partner');
          setSelectedPartnerId('');
        }
        break;
      case 'review-matches': 
        setCurrentStep('set-preferences'); 
        break;
      case 'create-invitation': 
        setCurrentStep('review-matches'); 
        break;
    }
  };

  return {
    currentStep,
    setCurrentStep,
    selectedPartnerId,
    setSelectedPartnerId,
    getStepProgress,
    goBack
  };
};
