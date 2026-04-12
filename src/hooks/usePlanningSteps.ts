import { useState } from 'react';

export type PlanningStep = 'select-mode' | 'select-partner' | 'set-preferences' | 'plan-together' | 'create-invitation';
export type DateModeType = 'solo' | 'single' | 'group';

interface UsePlanningStepsProps {
  preselectedFriend?: { id: string; name: string } | null;
  planningMode?: 'collaborative';
}

export const usePlanningSteps = ({ preselectedFriend, planningMode = 'collaborative' }: UsePlanningStepsProps) => {
  const initialStep: PlanningStep = preselectedFriend ? 'set-preferences' : 'select-mode';
  const [currentStep, setCurrentStepInternal] = useState<PlanningStep>(initialStep);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(preselectedFriend?.id || '');
  const [dateMode, setDateMode] = useState<DateModeType>('single');

  const setCurrentStep = (step: PlanningStep) => {
    setCurrentStepInternal(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case 'select-partner': return 10;
      case 'set-preferences': return 33;
      case 'plan-together': return 66;
      case 'create-invitation': return 100;
      default: return 0;
    }
  };

  const goBack = (preselectedFriend?: { id: string; name: string } | null, navigate?: (path: string) => void) => {
    switch (currentStep) {
      case 'select-partner':
        if (navigate) navigate('/home');
        break;
      case 'set-preferences':
        if (preselectedFriend) {
          if (navigate) navigate('/home');
        } else {
          setCurrentStepInternal('select-partner');
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
