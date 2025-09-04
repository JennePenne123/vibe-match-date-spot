import { useState, useEffect, useRef } from 'react';
import { useFriends } from '@/hooks/useFriends';

export type PlanningStep = 'select-partner' | 'set-preferences' | 'review-matches' | 'plan-together' | 'create-invitation';

interface UsePlanningStepsProps {
  preselectedFriend?: { id: string; name: string } | null;
  planningMode?: 'collaborative'; // Only collaborative mode supported
}

export const usePlanningSteps = ({ preselectedFriend, planningMode = 'collaborative' }: UsePlanningStepsProps) => {
  const { friends } = useFriends();
  // For collaborative mode with preselected friend, start at preferences
  const initialStep = preselectedFriend ? 'set-preferences' : 'select-partner';
  
  console.log('🔧 Planning Steps - Initialization DEBUG:', {
    preselectedFriend: preselectedFriend ? {
      id: preselectedFriend.id,
      name: preselectedFriend.name,
      exists: !!preselectedFriend
    } : null,
    planningMode,
    initialStep,
    willStartAtPreferences: planningMode === 'collaborative' && !!preselectedFriend,
    friendsAvailable: friends?.length || 0
  });
  
  const [currentStep, setCurrentStepInternal] = useState<PlanningStep>(initialStep);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(preselectedFriend?.id || '');
  const [hasManuallyNavigated, setHasManuallyNavigated] = useState(false);

  console.log('🔧 Planning Steps - State after initialization:', {
    currentStep,
    selectedPartnerId,
    hasManuallyNavigated,
    preselectedFriendId: preselectedFriend?.id
  });

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
    const advancedSteps = ['review-matches', 'plan-together', 'create-invitation'];
    if (advancedSteps.includes(currentStep)) {
      console.log('🔧 Planning Steps - SKIPPING sync for advanced step:', currentStep);
      return;
    }
    
      // Only sync if we haven't manually navigated and need to move forward (not backward)  
      if (!hasManuallyNavigated && currentStep !== expectedStep) {
        const stepOrder = ['select-partner', 'set-preferences', 'review-matches', 'plan-together', 'create-invitation'];
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
    // Collaborative mode only: skip partner selection if preselected, so 4 steps: preferences -> review -> plan-together -> invitation
    const progress = preselectedFriend
      ? (() => {
          switch (currentStep) {
            case 'select-partner': return 0; // Should not be shown with preselected friend
            case 'set-preferences': return 25;
            case 'review-matches': return 50;
            case 'plan-together': return 75;
            case 'create-invitation': return 100;
            default: return 0;
          }
        })()
      : (() => {
          // No preselected friend: 5 steps: select -> preferences -> review -> plan-together -> invitation
          switch (currentStep) {
            case 'select-partner': return 20;
            case 'set-preferences': return 40;
            case 'review-matches': return 60;
            case 'plan-together': return 80;
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
      case 'plan-together': 
        setCurrentStepInternal('review-matches'); 
        break;
      case 'create-invitation': 
        setCurrentStepInternal('plan-together'); 
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