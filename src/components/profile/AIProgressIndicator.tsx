import React from 'react';
import { useTranslation } from 'react-i18next';
import { Brain } from 'lucide-react';
import { useAILearning } from '@/hooks/useAILearning';
import { cn } from '@/lib/utils';

interface AIProgressIndicatorProps {
  variant?: 'compact' | 'inline';
  className?: string;
}

const AIProgressIndicator: React.FC<AIProgressIndicatorProps> = ({ 
  variant = 'compact',
  className 
}) => {
  const { t } = useTranslation();
  const { insights, loading } = useAILearning();

  if (loading || !insights) return null;

  const accuracy = Math.round(parseFloat(insights.aiAccuracy) || 0);
  const totalDates = insights.totalDates || 0;

  const getStage = () => {
    if (totalDates === 0) return { label: t('aiProgress.learningPhase'), emoji: '🌱', color: 'text-amber-600 dark:text-amber-400' };
    if (totalDates < 3) return { label: t('aiProgress.gettingToKnowYou'), emoji: '🧠', color: 'text-blue-600 dark:text-blue-400' };
    if (accuracy < 60) return { label: t('aiProgress.gettingBetter'), emoji: '📈', color: 'text-blue-600 dark:text-blue-400' };
    if (accuracy < 80) return { label: t('aiProgress.goodAccuracy'), emoji: '🎯', color: 'text-emerald-600 dark:text-emerald-400' };
    return { label: t('aiProgress.knowsYouWell'), emoji: '✨', color: 'text-primary' };
  };

  const stage = getStage();

  if (variant === 'inline') {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 backdrop-blur-sm border border-border/30 text-xs',
        className
      )}>
        <Brain className="w-3.5 h-3.5 text-primary" />
        <span className="text-muted-foreground">{t('aiProgress.aiLabel')}</span>
        <span className={cn('font-semibold', stage.color)}>
          {totalDates === 0 ? t('aiProgress.learningPhase') : `${accuracy}%`}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50',
      className
    )}>
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
        <Brain className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">{t('aiProgress.personalization')}</span>
          <span className="text-sm">{stage.emoji}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
              style={{ width: `${totalDates === 0 ? 5 : Math.min(accuracy, 100)}%` }}
            />
          </div>
          <span className={cn('text-xs font-semibold whitespace-nowrap', stage.color)}>
            {totalDates === 0 ? stage.label : `${accuracy}%`}
          </span>
        </div>
        {totalDates > 0 && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {t('aiProgress.basedOn', { count: totalDates })}
          </p>
        )}
      </div>
    </div>
  );
};

export default AIProgressIndicator;
