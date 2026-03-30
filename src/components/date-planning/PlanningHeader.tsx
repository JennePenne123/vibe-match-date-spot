import React from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface PlanningHeaderProps {
  progress: number;
  planningMode?: 'solo' | 'collaborative';
  showStartFromScratch?: boolean;
  onStartFromScratch?: () => void;
}

const steps = [
  { key: 'stepPartner', threshold: 10 },
  { key: 'stepPreferences', threshold: 33 },
  { key: 'stepVenues', threshold: 66 },
  { key: 'stepInvite', threshold: 100 },
];

const PlanningHeader: React.FC<PlanningHeaderProps> = ({
  progress,
  planningMode = 'solo',
  showStartFromScratch,
  onStartFromScratch,
}) => {
  const { t } = useTranslation();

  // Determine active step index
  const activeIndex = steps.findIndex(s => progress <= s.threshold);
  const currentStepNum = activeIndex === -1 ? steps.length : activeIndex + 1;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Compact top row: title + step counter + optional reset */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-foreground">
          {t('datePlanning.headerTitle')}
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {t('datePlanning.stepOf', { current: currentStepNum, total: steps.length })}
          </span>
          {showStartFromScratch && onStartFromScratch && (
            <Button
              onClick={onStartFromScratch}
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
            >
              {t('datePlanning.startFromScratch')}
            </Button>
          )}
        </div>
      </div>

      {/* Stepper dots with labels */}
      <div className="flex items-center gap-1">
        {steps.map((step, i) => {
          const isCompleted = progress > step.threshold;
          const isActive = i === (activeIndex === -1 ? steps.length - 1 : activeIndex);
          const isPast = progress >= step.threshold && !isActive;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center flex-1 min-w-0">
                {/* Dot/check */}
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 mb-1',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30 scale-110'
                      : isPast || isCompleted
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground',
                  )}
                >
                  {isPast || isCompleted ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    i + 1
                  )}
                </div>
                {/* Label */}
                <span
                  className={cn(
                    'text-[10px] leading-tight text-center truncate w-full transition-colors duration-300',
                    isActive ? 'text-primary font-medium' : 'text-muted-foreground',
                  )}
                >
                  {t(`datePlanning.${step.key}`)}
                </span>
              </div>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 rounded-full -mt-4 min-w-3',
                    progress > step.threshold ? 'bg-primary/40' : 'bg-muted',
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default PlanningHeader;
