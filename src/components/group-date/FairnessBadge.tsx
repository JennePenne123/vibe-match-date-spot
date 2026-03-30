import React from 'react';
import { cn } from '@/lib/utils';
import { Shield, Heart, ThumbsUp, AlertTriangle } from 'lucide-react';

export type FairnessLevel = 'perfect_consensus' | 'good_consensus' | 'acceptable' | 'compromised' | 'vetoed' | 'no_data';

interface FairnessBadgeProps {
  qualityLabel: FairnessLevel;
  className?: string;
  size?: 'sm' | 'md';
}

const badgeConfig: Record<FairnessLevel, {
  label: string;
  icon: React.ElementType;
  bg: string;
  text: string;
  border: string;
}> = {
  perfect_consensus: {
    label: 'Perfekter Konsens',
    icon: Heart,
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/30',
  },
  good_consensus: {
    label: 'Guter Kompromiss',
    icon: ThumbsUp,
    bg: 'bg-primary/10',
    text: 'text-primary',
    border: 'border-primary/30',
  },
  acceptable: {
    label: 'Akzeptabel',
    icon: Shield,
    bg: 'bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/30',
  },
  compromised: {
    label: 'Kompromiss',
    icon: AlertTriangle,
    bg: 'bg-orange-500/15',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/30',
  },
  vetoed: {
    label: 'Ausgeschlossen',
    icon: Shield,
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    border: 'border-destructive/30',
  },
  no_data: {
    label: 'Keine Daten',
    icon: Shield,
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
};

const FairnessBadge: React.FC<FairnessBadgeProps> = ({ qualityLabel, className, size = 'sm' }) => {
  const config = badgeConfig[qualityLabel] || badgeConfig.no_data;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        config.bg, config.text, config.border,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className,
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {config.label}
    </div>
  );
};

export default FairnessBadge;
