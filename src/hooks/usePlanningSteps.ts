
import { useState, useEffect, useRef } from 'react';
import { useFriends } from '@/hooks/useFriends';

export type PlanningStep = 'select-partner' | 'set-preferences' | 'review-matches' | 'create-invitation';

interface UsePlanningStepsProps {
  preselectedFriend?: { id: string; name: string } | null;
}

export const usePlanningSteps = ({ preselectedFriend }: UsePlanningStepsProps) => {
  const { friends } = useFriends();
  const [currentStep, setCurrentStep] = useState<PlanningStep>('select-partner');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(preselectedFriend?.id || '');
  const [hasManuallyNavigated, setHasManuallyNavigated] = useState(false);
  const hasAutoAdvanced = useRef(false);

  // Auto-advance if friend is pre-selected (only once on initial load)
  useEffect(() => {
    console.log('Planning steps - Auto-advance check:', { 
      preselectedFriend, 
      friendsLength: friends.length, 
      hasAutoAdvanced: hasAutoAdvanced.current,
      hasManuallyNavigated,
      currentStep 
    });
    
    if (preselectedFriend && friends.length > 0 && !hasAutoAdvanced.current && !hasManuallyNavigated && currentStep === 'select-partner') {
      const friend = friends.find(f => f.id === preselectedFriend.id);
      if (friend) {
        console.log('Planning steps - Auto-advancing to preferences for friend:', friend.name);
        setSelectedPartnerId(friend.id);
        // Don't auto-advance to preferences - let the session management handle it
        hasAutoAdvanced.current = true;
      }
    }
  }, [preselectedFriend, friends, hasManuallyNavigated, currentStep]);

  const getStepProgress = () => {
    switch (currentStep) {
      case 'select-partner': return 25;
      case 'set-preferences': return 50;
      case 'review-matches': return 75;
      case 'create-invitation': return 100;
      default: return 0;
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
