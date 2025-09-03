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
  
  const [currentStep, setCurrentStepInternal] = useState<PlanningStep>(initialStep);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(preselectedFriend?.id || '');
  const [hasManuallyNavigated, setHasManuallyNavigated] = useState(false);

  // Custom setter that tracks manual navigation
  const setCurrentStep = (step: PlanningStep) => {
    console.log('🔧 Planning Steps - setCurrentStep called:', {
      from: currentStep,
      to: step,
      hasManuallyNavigated,
      planningMode
    });
    setHasManuallyNavigated(true);
    setCurrentStepInternal(step);
  };

  // Sync currentStep with initialStep changes, but don't force regression from advanced steps
  useEffect(() => {
    const expectedStep = preselectedFriend ? 'set-preferences' : 'select-partner';
    
    console.log('🔧 Planning Steps - Sync Effect:', {
      currentStep,
      expectedStep,
      planningMode,
      hasPreselectedFriend: !!preselectedFriend,
      hasManuallyNavigated
    });
    
    // CRITICAL: Don't interfere with manual step transitions during AI analysis and results phases
    const advancedSteps = ['review-matches', 'create-invitation'];
    if (advancedSteps.includes(currentStep)) {
      console.log('🔧 Planning Steps - SKIPPING sync for advanced step:', currentStep);
      return;
    }
    
    // Only sync if we haven't manually navigated and need to move forward (not backward)  
    if (!hasManuallyNavigated && currentStep !== expectedStep) {
      const stepOrder = ['select-partner', 'set-preferences', 'review-matches', 'create-invitation'];
      const currentIndex = stepOrder.indexOf(currentStep);
      const expectedIndex = stepOrder.indexOf(expectedStep);
      
      // Only sync if expected step is later than current (moving forward), not backward
      if (expectedIndex > currentIndex) {
        console.log('🔧 Planning Steps - SYNCING currentStep from', currentStep, 'to', expectedStep);
        setCurrentStepInternal(expectedStep);
        
        // Also update selected partner ID if we have a preselected friend
        if (preselectedFriend && selectedPartnerId !== preselectedFriend.id) {
          setSelectedPartnerId(preselectedFriend.id);
        }
      } else {
        console.log('🔧 Planning Steps - SKIPPING sync to prevent regression from', currentStep, 'to', expectedStep);
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
          setCurrentStepInternal('select-partner');
          setSelectedPartnerId('');
        }
        break;
      case 'review-matches': 
        setCurrentStepInternal('set-preferences'); 
        break;
      case 'create-invitation': 
        setCurrentStepInternal('review-matches'); 
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