import React from 'react';
import { Brain, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getScoreTokens, getConfidenceTokens } from '../tokens/venue';

export interface VenueScoreProps {
  score: number;
  confidence?: number;
  contextBonus?: number;
  variant?: 'overlay' | 'inline' | 'compact' | 'large';
  showConfidence?: boolean;
  showBonus?: boolean;
  className?: string;
}

export const VenueScore: React.FC<VenueScoreProps> = ({
  score,
  confidence = 75,
  contextBonus,
  variant = 'overlay',
  showConfidence = true,
  showBonus = true,
  className,
}) => {
  const scoreTokens = getScoreTokens(score);
  const confidenceTokens = getConfidenceTokens(confidence);

  if (variant === 'compact') {
    return (
      <div className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold',
        scoreTokens.bg,
        scoreTokens.text,
        className
      )}>
        <Brain className="h-3 w-3" />
        <span>{Math.round(score)}%</span>
      </div>
    );
  }

  if (variant === 'large') {
    return (
      <div className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-xl',
        scoreTokens.bg,
        scoreTokens.border,
        'border',
        className
      )}>
        <div className="flex items-center gap-2">
          <Brain className={cn('h-6 w-6', scoreTokens.text)} />
          <span className={cn('text-3xl font-bold', scoreTokens.text)}>
            {Math.round(score)}%
          </span>
        </div>
        <span className={cn('text-sm font-medium', scoreTokens.text)}>
          {scoreTokens.label}
        </span>
        {showConfidence && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn('w-2 h-2 rounded-full', confidenceTokens.color)} />
            <span>{confidenceTokens.label} confidence</span>
          </div>
        )}
        {showBonus && contextBonus && contextBonus > 0 && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <TrendingUp className="h-3 w-3" />
            <span>+{contextBonus}% context bonus</span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg',
        scoreTokens.bg,
        scoreTokens.border,
        'border',
        className
      )}>
        <Brain className={cn('h-4 w-4', scoreTokens.text)} />
        <span className={cn('text-sm font-bold', scoreTokens.text)}>
          {Math.round(score)}%
        </span>
        {showConfidence && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className={cn('w-1.5 h-1.5 rounded-full', confidenceTokens.color)} />
            <span>{confidenceTokens.label}</span>
          </div>
        )}
        {showBonus && contextBonus && contextBonus > 0 && (
          <span className="text-xs text-primary">+{contextBonus}%</span>
        )}
      </div>
    );
  }

  // Default: overlay variant
  return (
    <div className={cn(
      'absolute top-3 left-3 flex items-center gap-1.5',
      'bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm',
      'px-2.5 py-1.5 rounded-full shadow-md',
      'border border-white/20 dark:border-gray-700/50',
      className
    )}>
      <Brain className={cn('h-4 w-4', scoreTokens.text)} />
      <span className={cn('text-sm font-bold', scoreTokens.text)}>
        {Math.round(score)}%
      </span>
      {showConfidence && (
        <span className={cn('w-1.5 h-1.5 rounded-full', confidenceTokens.color)} />
      )}
      {showBonus && contextBonus && contextBonus > 0 && (
        <span className="text-xs text-primary font-medium">+{contextBonus}</span>
      )}
    </div>
  );
};

export default VenueScore;
