import React from 'react';
import { Brain, Sparkles, TrendingUp } from 'lucide-react';
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
  const { insights, loading } = useAILearning();

  if (loading || !insights) return null;

  const accuracy = Math.round(insights.aiAccuracy || 0);
  const totalRatings = insights.totalRatings || 0;
  const confidence = insights.confidenceLevel || 'low';

  // Determine progress stage
  const getStage = () => {
    if (totalRatings === 0) return { label: 'Lernphase', emoji: '🌱', color: 'text-amber-600 dark:text-amber-400' };
    if (totalRatings < 3) return { label: 'Kennenlernen', emoji: '🧠', color: 'text-blue-600 dark:text-blue-400' };
    if (accuracy < 60) return { label: 'Wird besser', emoji: '📈', color: 'text-blue-600 dark:text-blue-400' };
    if (accuracy < 80) return { label: 'Gute Trefferquote', emoji: '🎯', color: 'text-emerald-600 dark:text-emerald-400' };
    return { label: 'Kennt dich gut', emoji: '✨', color: 'text-primary' };
  };

  const stage = getStage();

  if (variant === 'inline') {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 backdrop-blur-sm border border-border/30 text-xs',
        className
      )}>
        <Brain className="w-3.5 h-3.5 text-primary" />
        <span className="text-muted-foreground">KI-Genauigkeit:</span>
        <span className={cn('font-semibold', stage.color)}>
          {totalRatings === 0 ? 'Lernphase' : `${accuracy}%`}
        </span>
        {totalRatings > 0 && (
          <span className="text-muted-foreground">
            ({totalRatings} {totalRatings === 1 ? 'Bewertung' : 'Bewertungen'})
          </span>
        )}
      </div>
    );
  }

  // Compact variant for profile
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
          <span className="text-sm font-medium text-foreground">KI-Personalisierung</span>
          <span className="text-sm">{stage.emoji}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
              style={{ width: `${totalRatings === 0 ? 5 : Math.min(accuracy, 100)}%` }}
            />
          </div>
          <span className={cn('text-xs font-semibold whitespace-nowrap', stage.color)}>
            {totalRatings === 0 ? stage.label : `${accuracy}%`}
          </span>
        </div>
        {totalRatings > 0 && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Basierend auf {totalRatings} {totalRatings === 1 ? 'Bewertung' : 'Bewertungen'}
          </p>
        )}
      </div>
    </div>
  );
};

export default AIProgressIndicator;
