import { useState, useRef } from 'react';

export type PlanningStep = 'set-preferences' | 'plan-together' | 'create-invitation';

interface UsePlanningStepsProps {
  preselectedFriend?: { id: string; name: string } | null;
  planningMode?: 'collaborative';
}

export const usePlanningSteps = ({ preselectedFriend, planningMode = 'collaborative' }: UsePlanningStepsProps) => {
  const [currentStep, setCurrentStepInternal] = useState<PlanningStep>('set-preferences');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(preselectedFriend?.id || '');

  const setCurrentStep = (step: PlanningStep) => {
    setCurrentStepInternal(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case 'set-preferences': return 33;
      case 'plan-together': return 66;
      case 'create-invitation': return 100;
      default: return 0;
    }
  };

  const goBack = (preselectedFriend?: { id: string; name: string } | null, navigate?: (path: string) => void) => {
    switch (currentStep) {
      case 'set-preferences':
        if (navigate) navigate('/home');
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
