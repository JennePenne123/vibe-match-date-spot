import { useState, useEffect, useRef } from 'react';
import { useFriends } from '@/hooks/useFriends';

export type PlanningStep = 'select-partner' | 'set-preferences' | 'plan-together' | 'create-invitation';

interface UsePlanningStepsProps {
  preselectedFriend?: { id: string; name: string } | null;
  planningMode?: 'collaborative';
}

export const usePlanningSteps = ({ preselectedFriend, planningMode = 'collaborative' }: UsePlanningStepsProps) => {
  const { friends } = useFriends();
  const initialStep = preselectedFriend ? 'set-preferences' : 'select-partner';

  const [currentStep, setCurrentStepInternal] = useState<PlanningStep>(initialStep);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(preselectedFriend?.id || '');
  const [hasManuallyNavigated, setHasManuallyNavigated] = useState(false);

  const setCurrentStep = (step: PlanningStep) => {
    setHasManuallyNavigated(true);
    setCurrentStepInternal(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const expectedStep = preselectedFriend ? 'set-preferences' : 'select-partner';

    const advancedSteps = ['plan-together', 'create-invitation'];
    if (advancedSteps.includes(currentStep)) return;

    if (!hasManuallyNavigated && currentStep !== expectedStep) {
      const stepOrder = ['select-partner', 'set-preferences', 'plan-together', 'create-invitation'];
      const currentIndex = stepOrder.indexOf(currentStep);
      const expectedIndex = stepOrder.indexOf(expectedStep);

      if (expectedIndex > currentIndex) {
        setCurrentStepInternal(expectedStep);
        if (preselectedFriend && selectedPartnerId !== preselectedFriend.id) {
          setSelectedPartnerId(preselectedFriend.id);
        }
      }
    }
  }, [planningMode, preselectedFriend, currentStep, selectedPartnerId, hasManuallyNavigated]);

  const hasAutoAdvanced = useRef(false);

  const getStepProgress = () => {
    const progress = preselectedFriend
      ? (() => {
          switch (currentStep) {
            case 'select-partner': return 0;
            case 'set-preferences': return 33;
            case 'plan-together': return 66;
            case 'create-invitation': return 100;
            default: return 0;
          }
        })()
      : (() => {
          switch (currentStep) {
            case 'select-partner': return 25;
            case 'set-preferences': return 50;
            case 'plan-together': return 75;
            case 'create-invitation': return 100;
            default: return 0;
          }
        })();

    return progress;
  };

  const goBack = (preselectedFriend?: { id: string; name: string } | null, navigate?: (path: string) => void) => {
    setHasManuallyNavigated(true);

    switch (currentStep) {
      case 'select-partner':
        if (navigate) navigate('/home');
        break;
      case 'set-preferences':
        if (preselectedFriend) {
          if (navigate) navigate('/home');
        } else {
          setCurrentStepInternal('select-partner');
          setSelectedPartnerId('');
        }
        break;
      case 'plan-together':
        setCurrentStepInternal('set-preferences');
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
