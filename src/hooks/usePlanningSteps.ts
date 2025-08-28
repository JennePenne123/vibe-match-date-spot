
import { useState, useEffect, useRef } from 'react';
import { useFriends } from '@/hooks/useFriends';

export type PlanningStep = 'select-partner' | 'set-preferences' | 'review-matches' | 'create-invitation';

interface UsePlanningStepsProps {
  preselectedFriend?: { id: string; name: string } | null;
  planningMode?: 'collaborative'; // Only collaborative mode supported
}

export const usePlanningSteps = ({ preselectedFriend, planningMode = 'collaborative' }: UsePlanningStepsProps) => {
  const { friends } = useFriends();
  // For collaborative mode with preselected friend, start at preferences
  const initialStep = preselectedFriend ? 'set-preferences' : 'select-partner';
  
  console.log('🔧 Planning Steps - Initialization:', {
    preselectedFriend: preselectedFriend?.name,
    planningMode,
    initialStep,
    willStartAtPreferences: planningMode === 'collaborative' && !!preselectedFriend
  });
  
  const [currentStep, setCurrentStep] = useState<PlanningStep>(initialStep);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(preselectedFriend?.id || '');
  const [hasManuallyNavigated, setHasManuallyNavigated] = useState(false);

  // Sync currentStep with initialStep changes (for cases when props change after initial render)
  useEffect(() => {
    const expectedStep = preselectedFriend ? 'set-preferences' : 'select-partner';
    
    console.log('🔧 Planning Steps - Sync Effect:', {
      currentStep,
      expectedStep,
      planningMode,
      hasPreselectedFriend: !!preselectedFriend,
      hasManuallyNavigated
    });
    
    // Only sync if we haven't manually navigated and the expected step is different
    if (!hasManuallyNavigated && currentStep !== expectedStep) {
      console.log('🔧 Planning Steps - SYNCING currentStep from', currentStep, 'to', expectedStep);
      setCurrentStep(expectedStep);
      
      // Also update selected partner ID if we have a preselected friend
      if (preselectedFriend && selectedPartnerId !== preselectedFriend.id) {
        setSelectedPartnerId(preselectedFriend.id);
      }
    }
  }, [planningMode, preselectedFriend, currentStep, selectedPartnerId, hasManuallyNavigated]);
  const hasAutoAdvanced = useRef(false);

  // Remove auto-advance logic - collaborative mode handles this differently

  const getStepProgress = () => {
    // Collaborative mode only: skip partner selection if preselected, so 3 steps: preferences -> review -> invitation
    const progress = preselectedFriend
      ? (() => {
          switch (currentStep) {
            case 'select-partner': return 0; // Should not be shown with preselected friend
            case 'set-preferences': return 33;
            case 'review-matches': return 66;
            case 'create-invitation': return 100;
            default: return 0;
          }
        })()
      : (() => {
          // No preselected friend: 4 steps: select -> preferences -> review -> invitation
          switch (currentStep) {
            case 'select-partner': return 25;
            case 'set-preferences': return 50;
            case 'review-matches': return 75;
            case 'create-invitation': return 100;
            default: return 0;
          }
        })();
    
    console.log('🚀 Progress calculation:', {
      currentStep,
      planningMode,
      progress
    });
    
    return progress;
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
