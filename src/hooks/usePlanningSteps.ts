
import { useState, useEffect } from 'react';
import { useFriends } from '@/hooks/useFriends';

export type PlanningStep = 'select-partner' | 'set-preferences' | 'review-matches' | 'create-invitation';

interface UsePlanningStepsProps {
  preselectedFriend?: { id: string; name: string } | null;
}

export const usePlanningSteps = ({ preselectedFriend }: UsePlanningStepsProps) => {
  const { friends } = useFriends();
  const [currentStep, setCurrentStep] = useState<PlanningStep>('select-partner');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(preselectedFriend?.id || '');

  // Auto-advance if friend is pre-selected
  useEffect(() => {
    if (preselectedFriend && friends.length > 0) {
      const friend = friends.find(f => f.id === preselectedFriend.id);
      if (friend) {
        setSelectedPartnerId(friend.id);
        setCurrentStep('set-preferences');
      }
    }
  }, [preselectedFriend, friends]);

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
    switch (currentStep) {
      case 'set-preferences': 
        if (preselectedFriend && navigate) {
          navigate('/my-friends');
        } else {
          setCurrentStep('select-partner');
        }
        break;
      case 'review-matches': setCurrentStep('set-preferences'); break;
      case 'create-invitation': setCurrentStep('review-matches'); break;
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
