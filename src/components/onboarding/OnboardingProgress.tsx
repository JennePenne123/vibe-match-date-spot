import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Check } from 'lucide-react';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

const stepLabels = [
  '', // step 0 = welcome
  'Persönlichkeit',
  'Beziehungsziel',
  'Lifestyle',
  'Szenarien',
  'Food & Vibes'
];

const completionMessages = [
  '',
  '🎯 Großartig! Wir kennen deine Persönlichkeit.',
  '💫 Super! Dein Beziehungsziel ist gesetzt.',
  '🌟 Perfekt! Dein Lifestyle-Profil steht.',
  '🧠 Nice! Die KI versteht dich schon besser.',
  '🎉 Fast fertig! Noch die letzten Feinheiten.',
];

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ currentStep, totalSteps }) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full px-1 space-y-2">
      {/* Step dots + label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNum = i + 1;
            const isCompleted = currentStep > stepNum;
            const isCurrent = currentStep === stepNum;
            return (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  isCompleted && 'bg-primary scale-100',
                  isCurrent && 'bg-primary w-6 rounded-full',
                  !isCompleted && !isCurrent && 'bg-muted'
                )}
              />
            );
          })}
        </div>
        <span className="text-xs font-medium text-primary">
          {stepLabels[currentStep] || ''}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Completion message from previous step */}
      {currentStep > 1 && completionMessages[currentStep - 1] && (
        <div className="flex items-center gap-1.5 text-[11px] text-primary/80 animate-fade-in">
          <Check className="w-3 h-3" />
          <span>{completionMessages[currentStep - 1]}</span>
        </div>
      )}
    </div>
  );
};

export default OnboardingProgress;
